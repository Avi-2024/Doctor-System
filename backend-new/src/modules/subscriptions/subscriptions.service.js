/**
 * Subscriptions Service
 * Owns minimal Sprint 3 current subscription reads.
 */

const { ApiError } = require('../../common/errors/ApiError');
const { resolveTenantTargetWithAudit } = require('../../common/middleware/tenantOverride');
const { assertClinicReadable } = require('../clinics/clinics.lifecycle');
const { recordAudit } = require('../audit/audit.service');
const defaultRepository = require('./subscriptions.repository');

// Normalizes subscription records for API responses.
const normalizeSubscription = (subscription) => subscription ? ({
  id: subscription.id,
  clinicId: subscription.clinic_id,
  status: subscription.status,
  startsAt: subscription.starts_at || null,
  endsAt: subscription.ends_at || null,
  trialEndsAt: subscription.trial_ends_at || null,
  plan: subscription.plan ? {
    id: subscription.plan.id,
    code: subscription.plan.code,
    name: subscription.plan.name,
    trialDays: subscription.plan.trial_days,
    currency: subscription.plan.currency,
    priceCents: subscription.plan.price_cents,
  } : null,
}) : null;

// Creates the subscriptions domain service.
const createSubscriptionsService = ({ repository = defaultRepository, auditRecorder = recordAudit } = {}) => {
  // Reads the current subscription for a target clinic.
  const getCurrentSubscription = async ({ context, requestedClinicId = null }) => {
    const clinicId = await resolveTenantTargetWithAudit({
      context,
      requestedClinicId,
      requireForPlatform: true,
      auditRecorder,
      operation: 'subscriptions',
    });
    const clinic = await repository.findClinicById(clinicId);
    assertClinicReadable(clinic);
    const subscription = await repository.findCurrentSubscription(clinicId);
    if (!subscription) throw new ApiError(404, 'Subscription not found');
    return { subscription: normalizeSubscription(subscription) };
  };

  return { getCurrentSubscription };
};

module.exports = { createSubscriptionsService, normalizeSubscription };
