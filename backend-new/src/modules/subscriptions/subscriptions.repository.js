/**
 * Subscriptions Repository
 * Owns Prisma access for minimal current subscription reads.
 */

const { prisma, model } = require('../../database/prisma');

const clinics = (connection) => model(connection || prisma, 'clinics');
const clinicSubscriptions = (connection) => model(connection || prisma, 'clinic_subscriptions');

// Finds a clinic by id.
const findClinicById = async (clinicId, connection) => clinics(connection).findFirst({
  where: { id: clinicId, is_deleted: false },
});

// Finds the current active or trialing subscription for a clinic.
const findCurrentSubscription = async (clinicId, connection) => clinicSubscriptions(connection).findFirst({
  where: {
    clinic_id: clinicId,
    is_deleted: false,
    status: { in: ['TRIALING', 'ACTIVE'] },
  },
  include: { plan: true },
  orderBy: [{ created_at: 'desc' }],
});

module.exports = {
  findClinicById,
  findCurrentSubscription,
};
