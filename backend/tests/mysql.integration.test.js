/**
 * Prisma MySQL Integration Tests
 * Verifies tenant isolation, auth rotation, audit, and sockets.
 */

process.env.JWT_ACCESS_SECRET = 'integration-access-secret-with-sufficient-length';
process.env.JWT_REFRESH_SECRET = 'integration-refresh-secret-with-sufficient-length';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const test = require('node:test');
const bcrypt = require('bcryptjs');
const { io: createSocketClient } = require('socket.io-client');
const { createBaseRepository } = require('../src/common/repositories/BaseRepository');
const authService = require('../src/modules/auth/auth.service');
const { recordAudit } = require('../src/modules/audit/audit.service');
const { configureSocket, emitClinicEvent } = require('../src/config/socket');
const { prisma, close } = require('../src/database/prisma');
const clinicsService = require('../src/modules/clinics/clinics.service');
const usersService = require('../src/modules/users/users.service');
const { ROLES } = require('../src/common/constants/roles');
const billingService = require('../src/modules/billing/billing.service');
const notificationsService = require('../src/modules/notifications/notifications.service');

const enabled = process.env.RUN_MYSQL_INTEGRATION === 'true';

// Close shared Prisma pool.
test.after(async () => {
  if (enabled) await close();
});

// Insert test clinic.
const insertClinic = async (id, code) => prisma.clinics.create({ data: { id, clinic_id: id, name: `Clinic ${code}`, code } });

// Insert active test user.
const insertUser = async (clinicId, userId, email, password) => prisma.users.create({
  data: {
    id: userId,
    clinic_id: clinicId,
    full_name: 'Integration Doctor',
    email,
    password_hash: await bcrypt.hash(password, 4),
    role: 'DOCTOR',
    permissions: ['*'],
    created_by: userId,
    updated_by: userId,
  },
});

// Remove all durable clinic fixture records.
const cleanupClinic = async (clinicId) => {
  await prisma.whatsapp_messages.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.notifications.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.payments.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.invoice_items.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.invoices.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.queue_entries.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.queue_counters.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.patient_records.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.patients.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.refresh_tokens.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.password_reset_tokens.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.user_invitations.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.audit_logs.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.clinic_subscriptions.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.users.deleteMany({ where: { clinic_id: clinicId } });
  await prisma.clinics.deleteMany({ where: { id: clinicId } });
};

test('Prisma repository isolates tenants and soft deletes', { skip: !enabled }, async () => {
  const repository = createBaseRepository({
    table: 'patients',
    columns: ['id', 'clinic_id', 'patient_code', 'full_name', 'phone', 'created_by', 'updated_by', 'is_deleted'],
    searchable: ['full_name'],
  });
  const clinicA = crypto.randomUUID();
  const clinicB = crypto.randomUUID();
  try {
    await insertClinic(clinicA, `A-${crypto.randomUUID().slice(0, 8)}`);
    await insertClinic(clinicB, `B-${crypto.randomUUID().slice(0, 8)}`);
    const patientA = await repository.create({ clinic_id: clinicA, patient_code: 'A-1', full_name: 'Tenant A Patient', phone: '1000000001' });
    await repository.create({ clinic_id: clinicB, patient_code: 'B-1', full_name: 'Tenant B Patient', phone: '1000000002' });
    const list = await repository.list(clinicA, { search: 'Patient' });
    assert.equal(list.items.length, 1);
    assert.equal(list.items[0].clinic_id, clinicA);
    assert.deepEqual(list.meta, { page: 1, limit: 20, total: 1, totalPages: 1 });
    await repository.softDelete(patientA.id, clinicA, null);
    assert.equal(await repository.findById(patientA.id, clinicA), null);
  } finally {
    await cleanupClinic(clinicA);
    await cleanupClinic(clinicB);
  }
});

test('auth refresh rotates tokens and rejects reuse', { skip: !enabled }, async () => {
  const clinicId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const email = `doctor-${crypto.randomUUID()}@example.test`;
  const password = 'StrongPassword123!';
  try {
    await insertClinic(clinicId, `AUTH-${crypto.randomUUID().slice(0, 8)}`);
    await insertUser(clinicId, userId, email, password);
    const login = await authService.login({ clinicId, email, password });
    const rotated = await authService.refresh(login.tokens.refreshToken);
    assert.notEqual(rotated.tokens.refreshToken, login.tokens.refreshToken);
    await assert.rejects(authService.refresh(login.tokens.refreshToken), /reuse detected/);
    const activeTokens = await prisma.refresh_tokens.count({ where: { user_id: userId, revoked_at: null } });
    assert.equal(activeTokens, 0);
  } finally {
    await cleanupClinic(clinicId);
  }
});

test('clinic onboarding creates trial and invitation acceptance', { skip: !enabled }, async () => {
  let clinicId;
  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const onboarded = await clinicsService.onboard({
      clinic: { name: `Integration Clinic ${suffix}`, code: `INT-${suffix}` },
      owner: { fullName: 'Integration Owner', email: `owner-${suffix}@example.test`, password: 'StrongPassword123!' },
    });
    clinicId = onboarded.clinic.id;
    const subscription = await prisma.clinic_subscriptions.findFirst({ where: { clinic_id: clinicId, status: 'TRIAL', is_deleted: false } });
    assert.equal(subscription.status, 'TRIAL');
    const invited = await usersService.inviteUser(
      { fullName: 'Invited Doctor', email: `invited-${suffix}@example.test`, role: ROLES.DOCTOR },
      { clinicId, userId: onboarded.owner.id, role: ROLES.CLINIC_OWNER },
    );
    assert.equal(invited.invitation.clinic_id, clinicId);
    const accepted = await usersService.acceptInvitation({ token: invited.invitationToken, password: 'StrongPassword123!' });
    assert.equal(accepted.user.role, ROLES.DOCTOR);
    assert.equal(accepted.user.clinic_id, clinicId);
  } finally {
    if (clinicId) await cleanupClinic(clinicId);
  }
});

test('subscription limits block excess tenant users', { skip: !enabled }, async () => {
  let clinicId;
  const planId = crypto.randomUUID();
  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const onboarded = await clinicsService.onboard({
      clinic: { name: `Limited Clinic ${suffix}`, code: `LIMIT-${suffix}` },
      owner: { fullName: 'Limited Owner', email: `limited-owner-${suffix}@example.test`, password: 'StrongPassword123!' },
    });
    clinicId = onboarded.clinic.id;
    await prisma.subscription_plans.create({ data: { id: planId, clinic_id: null, code: `ONE-${suffix}`, name: 'Single User Plan', limits: { users: 1 }, features: [] } });
    await prisma.clinic_subscriptions.updateMany({ where: { clinic_id: clinicId }, data: { plan_id: planId } });
    const invited = await usersService.inviteUser(
      { fullName: 'Blocked Doctor', email: `blocked-${suffix}@example.test`, role: ROLES.DOCTOR },
      { clinicId, userId: onboarded.owner.id, role: ROLES.CLINIC_OWNER },
    );
    await assert.rejects(
      usersService.acceptInvitation({ token: invited.invitationToken, password: 'StrongPassword123!' }),
      /users subscription limit reached/,
    );
  } finally {
    if (clinicId) await cleanupClinic(clinicId);
    await prisma.subscription_plans.deleteMany({ where: { id: planId } });
  }
});

test('billing persists normalized items and payments', { skip: !enabled }, async () => {
  let clinicId;
  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const onboarded = await clinicsService.onboard({
      clinic: { name: `Billing Clinic ${suffix}`, code: `BILL-${suffix}` },
      owner: { fullName: 'Billing Owner', email: `billing-owner-${suffix}@example.test`, password: 'StrongPassword123!' },
    });
    clinicId = onboarded.clinic.id;
    const patientId = crypto.randomUUID();
    await prisma.patients.create({
      data: { id: patientId, clinic_id: clinicId, patient_code: `PAT-${suffix}`, full_name: 'Billing Patient', phone: '9999999999', created_by: onboarded.owner.id, updated_by: onboarded.owner.id },
    });
    const invoice = await billingService.createInvoice({
      invoiceNumber: `INV-${suffix}`,
      patientId,
      items: [{ description: 'Consultation', quantity: 2, unitPrice: 50 }],
      discount: 10,
      tax: 5,
    }, { clinicId, userId: onboarded.owner.id });
    assert.equal(invoice.total_amount, 95);
    assert.equal(invoice.items.length, 1);
    await assert.rejects(
      billingService.createInvoice({ invoiceNumber: `BAD-${suffix}`, patientId, items: [{ description: 'Bad', quantity: -1, unitPrice: 50 }] }, { clinicId, userId: onboarded.owner.id }),
      /positive/,
    );
    const fetched = await billingService.getInvoice(invoice.id, { clinicId });
    assert.equal(fetched.items[0].total_amount, 100);
    const paid = await billingService.recordPayment({ invoiceId: invoice.id, amount: 95, method: 'CASH' }, { clinicId, userId: onboarded.owner.id });
    assert.equal(paid.invoice.status, 'PAID');
  } finally {
    if (clinicId) await cleanupClinic(clinicId);
  }
});

test('in-app reminders transition to read', { skip: !enabled }, async () => {
  let clinicId;
  try {
    const suffix = crypto.randomUUID().slice(0, 8);
    const onboarded = await clinicsService.onboard({
      clinic: { name: `Reminder Clinic ${suffix}`, code: `REM-${suffix}` },
      owner: { fullName: 'Reminder Owner', email: `reminder-owner-${suffix}@example.test`, password: 'StrongPassword123!' },
    });
    clinicId = onboarded.clinic.id;
    const reminder = await notificationsService.queueReminder({
      channel: 'IN_APP',
      recipient: onboarded.owner.id,
      message: 'Appointment reminder',
    }, { clinicId, userId: onboarded.owner.id });
    const read = await notificationsService.markRead(reminder.id, { clinicId, userId: onboarded.owner.id });
    assert.equal(read.status, 'READ');
  } finally {
    if (clinicId) await cleanupClinic(clinicId);
  }
});

test('audit writes redact sensitive context', { skip: !enabled }, async () => {
  const clinicId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  try {
    await insertClinic(clinicId, `AUDIT-${crypto.randomUUID().slice(0, 8)}`);
    await insertUser(clinicId, userId, `audit-${crypto.randomUUID()}@example.test`, 'StrongPassword123!');
    await recordAudit({
      req: { tenant: { clinicId }, auth: { userId }, requestId: crypto.randomUUID() },
      action: 'TEST_WRITE',
      moduleName: 'Integration',
      entityType: 'Clinic',
      entityId: clinicId,
      after: { verified: true, password_hash: 'secret' },
    });
    const row = await prisma.audit_logs.findFirst({ where: { clinic_id: clinicId, action: 'TEST_WRITE' } });
    assert.equal(row.clinic_id, clinicId);
    assert.equal(row.actor_user_id, userId);
    assert.equal(row.after_data.password_hash, '[REDACTED]');
  } finally {
    await cleanupClinic(clinicId);
  }
});

test('Socket.IO emits clinic-scoped queue events', { skip: !enabled }, async () => {
  const clinicId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const email = `socket-${crypto.randomUUID()}@example.test`;
  const password = 'StrongPassword123!';
  const server = http.createServer();
  const socketServer = configureSocket(server);
  let client;
  try {
    await insertClinic(clinicId, `SOCKET-${crypto.randomUUID().slice(0, 8)}`);
    await insertUser(clinicId, userId, email, password);
    const login = await authService.login({ clinicId, email, password });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    client = createSocketClient(`http://127.0.0.1:${address.port}`, { auth: { token: login.tokens.accessToken }, transports: ['websocket'] });
    await new Promise((resolve, reject) => {
      client.once('connect', resolve);
      client.once('connect_error', reject);
    });
    const received = new Promise((resolve) => client.once('queue:updated', resolve));
    emitClinicEvent(clinicId, 'queue:updated', { id: 'queue-test' });
    assert.deepEqual(await received, { id: 'queue-test' });
  } finally {
    if (client) client.close();
    await new Promise((resolve) => socketServer.close(resolve));
    await new Promise((resolve) => server.close(resolve));
    await cleanupClinic(clinicId);
  }
});
