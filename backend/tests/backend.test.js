/**
 * Backend Tests
 * Verifies modular MySQL backend invariants.
 */

process.env.JWT_ACCESS_SECRET = 'test-access-secret-with-sufficient-length';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-sufficient-length';
process.env.WHATSAPP_APP_SECRET = 'test-whatsapp-secret';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');
const { attachTenant } = require('../src/common/middleware/tenant');
const { allowRoles, allowPermissions } = require('../src/common/middleware/rbac');
const { getPagination, buildMeta } = require('../src/common/utils/pagination');
const { calculateInvoice } = require('../src/modules/billing/billing.service');
const { ROLES } = require('../src/common/constants/roles');
const { resolveLimit } = require('../src/modules/subscriptions/subscriptions.service');
const { verifySignature, buildOutboundPayload } = require('../src/modules/whatsapp/whatsapp.service');
const { hashToken } = require('../src/common/utils/token');
const { validationResult } = require('express-validator');
const { bookingRules } = require('../src/modules/appointments/appointments.validator');
const storageService = require('../src/modules/storage/storage.service');
const { sanitizeSearch, pickFilters } = require('../src/common/utils/sanitizeQuery');
const fs = require('node:fs');
const path = require('node:path');

test('tenant middleware overwrites hostile scope', () => {
  const req = { auth: { role: ROLES.DOCTOR, clinicId: 'clinic-a' }, body: { clinicId: 'clinic-b' }, query: { clinicId: 'clinic-b' } };
  attachTenant(req, {}, (error) => assert.equal(error, undefined));
  assert.equal(req.body.clinicId, 'clinic-a');
  assert.equal(req.query.clinicId, 'clinic-a');
});

test('RBAC rejects unauthorized role', () => {
  let received;
  allowRoles(ROLES.CLINIC_OWNER)({ auth: { role: ROLES.PATIENT } }, {}, (error) => { received = error; });
  assert.equal(received.statusCode, 403);
});

test('permission guard supports explicit grants', () => {
  let denied;
  allowPermissions('patients:write')({ auth: { role: ROLES.RECEPTIONIST, permissions: ['patients:read'] } }, {}, (error) => { denied = error; });
  assert.equal(denied.statusCode, 403);
  let allowed = false;
  allowPermissions('patients:write')({ auth: { role: ROLES.RECEPTIONIST, permissions: ['patients:write'] } }, {}, (error) => { allowed = !error; });
  assert.equal(allowed, true);
});

test('appointment validator rejects malformed booking', async () => {
  const req = { body: { patientId: 'bad-id', doctorId: 'bad-id', appointmentDate: 'bad-date', startTime: '9am', endTime: '10am' } };
  for (const rule of bookingRules) await rule.run(req);
  assert.equal(validationResult(req).isEmpty(), false);
});

test('pagination remains bounded', () => {
  assert.deepEqual(getPagination({ page: 2, limit: 500 }), { page: 2, limit: 100, offset: 100 });
  assert.deepEqual(buildMeta({ page: 2, limit: 10, total: 21 }), { page: 2, limit: 10, total: 21, totalPages: 3 });
});

test('query sanitization removes controls and unknown filters', () => {
  assert.equal(sanitizeSearch('  PATIENT\u0000 NAME  '), 'patient name');
  assert.deepEqual(pickFilters({ role: 'DOCTOR', hostile: 'value' }, ['role']), { role: 'DOCTOR' });
});

test('invoice totals remain server-calculated', () => {
  const result = calculateInvoice({ items: [{ description: 'Consultation', quantity: 2, unitPrice: 100 }], discount: 10, tax: 5 });
  assert.equal(result.subtotal, 200);
  assert.equal(result.total, 195);
  assert.throws(() => calculateInvoice({ items: [{ unitPrice: 10 }], discount: 20 }), /Discount cannot exceed/);
  assert.throws(() => calculateInvoice({ items: [{ unitPrice: 10, quantity: -1 }] }), /positive/);
  assert.throws(() => calculateInvoice({ items: [{ unitPrice: 10 }], discount: -1 }), /cannot be negative/);
});

test('migration defines MySQL tenant fields', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '001_core.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS patients/);
  assert.match(migration, /clinic_id CHAR\(36\) NOT NULL/);
  assert.doesNotMatch(migration, /MongoDB|mongoose/i);
});

test('Prisma schema defines MySQL datasource', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma', 'schema.prisma'), 'utf8');
  assert.match(schema, /provider = "mysql"/);
  assert.match(schema, /model users/);
  assert.match(schema, /model queue_counters/);
});

test('invitation migration stores hashed tokens', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '002_user_invitations.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS user_invitations/);
  assert.match(migration, /token_hash CHAR\(64\) NOT NULL/);
  assert.doesNotMatch(migration, /\btoken VARCHAR/i);
});

test('default trial defines enforced limits', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '003_default_trial_plan.sql'), 'utf8');
  assert.match(migration, /DEFAULT_TRIAL/);
  assert.match(migration, /monthlyAppointments/);
  assert.match(migration, /monthlyWhatsAppMessages/);
});

test('notification retries store failure context', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '004_notification_retries.sql'), 'utf8');
  assert.match(migration, /last_error VARCHAR\(1000\)/);
  assert.match(migration, /idx_notification_stale/);
});

test('subscription limits support unlimited metrics', () => {
  const plan = { limits: JSON.stringify({ users: 10, patients: -1 }) };
  assert.equal(resolveLimit(plan, 'users'), 10);
  assert.equal(resolveLimit(plan, 'patients'), null);
  assert.equal(resolveLimit(plan, 'storageBytes'), null);
});

test('opaque tokens are never stored directly', () => {
  const token = 'sensitive-token-value';
  assert.notEqual(hashToken(token), token);
  assert.equal(hashToken(token).length, 64);
});

test('WhatsApp webhook signature rejects tampering', () => {
  const body = Buffer.from('{"entry":[]}');
  const signature = `sha256=${crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(body).digest('hex')}`;
  assert.doesNotThrow(() => verifySignature(body, signature));
  assert.throws(() => verifySignature(Buffer.from('tampered'), signature), /Invalid WhatsApp webhook signature/);
});

test('WhatsApp templates build provider payloads', () => {
  const result = buildOutboundPayload({
    recipient: '919999999999',
    message: 'Template: appointment_reminder',
    payload: { templateName: 'appointment_reminder', languageCode: 'en_US', components: [] },
  });
  assert.equal(result.type, 'template');
  assert.equal(result.template.name, 'appointment_reminder');
});

test('storage upload rejects missing configuration or file', async () => {
  await assert.rejects(
    storageService.upload({ file: null, ownerType: 'GENERAL', ownerId: null, context: { clinicId: 'clinic', userId: 'user' } }),
    /AWS S3 bucket is not configured|File is required/,
  );
});

test('every mounted module has API documentation', () => {
  const requiredDocs = [
    'AUTH.md', 'CLINICS.md', 'USERS.md', 'PATIENTS.md', 'PATIENT_RECORDS.md', 'BRANCHES.md',
    'SCHEDULES.md', 'APPOINTMENTS.md', 'QUEUE.md', 'CLINICAL.md', 'VITALS.md', 'PRESCRIPTIONS.md',
    'PRESCRIPTION_TEMPLATES.md', 'LAB_TESTS.md', 'LAB_ORDERS.md', 'LAB_ORDER_ITEMS.md', 'LAB_REPORTS.md', 'BILLING.md',
    'STORAGE.md', 'WHATSAPP_NOTIFICATIONS.md', 'WHATSAPP_ACCOUNTS.md', 'WHATSAPP_MESSAGES.md',
    'NOTIFICATIONS.md', 'WHATSAPP_TEMPLATES.md', 'SUBSCRIPTION_PLANS.md', 'SUBSCRIPTIONS.md', 'SETTINGS.md', 'AUDIT.md', 'REPORTS.md',
  ];
  const docsDirectory = path.join(__dirname, '..', 'docs', 'api');
  requiredDocs.forEach((file) => assert.equal(fs.existsSync(path.join(docsDirectory, file)), true, `${file} missing`));
});

test('normalized line-item migration exists', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '005_normalized_line_items.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS invoice_items/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS lab_order_items/);
});

test('WhatsApp template migration exists', () => {
  const migration = fs.readFileSync(path.join(__dirname, '..', 'src', 'database', 'migrations', '006_whatsapp_templates.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS whatsapp_templates/);
  assert.match(migration, /provider_template_name/);
});
