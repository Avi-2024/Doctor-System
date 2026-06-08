/**
 * Subscriptions Repository
 * Reads active plans and tenant usage.
 */

const { prisma } = require('../../database/prisma');

// Find active subscription plan.
const findActivePlan = async (clinicId, connection) => {
  const client = connection || prisma;
  const subscription = await client.clinic_subscriptions.findFirst({
    where: { clinic_id: clinicId, status: { in: ['TRIAL', 'ACTIVE'] }, starts_at: { lte: new Date() }, OR: [{ ends_at: null }, { ends_at: { gt: new Date() } }], is_deleted: false },
    orderBy: { starts_at: 'desc' },
  });
  if (!subscription) return null;
  const plan = await client.subscription_plans.findFirst({ where: { id: subscription.plan_id, is_deleted: false } });
  return plan ? { ...subscription, code: plan.code, name: plan.name, limits: plan.limits, features: plan.features } : null;
};

// Find active subscription plan.
const findActivePlanForUpdate = async (clinicId, connection) => findActivePlan(clinicId, connection);

// Read current metric usage.
const getMetricUsage = async (clinicId, metric, connection) => {
  const client = connection || prisma;
  if (metric === 'users') return client.users.count({ where: { clinic_id: clinicId, is_active: true, is_deleted: false } });
  if (metric === 'patients') return client.patients.count({ where: { clinic_id: clinicId, is_deleted: false } });
  if (metric === 'monthlyAppointments') {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return client.appointments.count({ where: { clinic_id: clinicId, appointment_date: { gte: start, lt: end }, is_deleted: false } });
  }
  if (metric === 'storageBytes') {
    const result = await client.attachments.aggregate({ where: { clinic_id: clinicId, is_deleted: false }, _sum: { size_bytes: true } });
    return Number(result._sum.size_bytes || 0);
  }
  if (metric === 'monthlyWhatsAppMessages') {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return client.whatsapp_messages.count({ where: { clinic_id: clinicId, direction: 'OUTBOUND', created_at: { gte: start, lt: end }, is_deleted: false } });
  }
  return 0;
};

module.exports = { findActivePlan, findActivePlanForUpdate, getMetricUsage };
