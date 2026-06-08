/**
 * Subscriptions Service
 * Enforces active plans and usage limits.
 */

const { runInTransaction } = require('../../common/repositories/unitOfWork.repository');
const { ApiError } = require('../../common/errors/ApiError');
const repository = require('./subscriptions.repository');

const usageMetrics = ['users', 'patients', 'monthlyAppointments', 'storageBytes', 'monthlyWhatsAppMessages'];

// Normalize JSON value.
const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value) : value || {});

// Resolve configured metric limit.
const resolveLimit = (plan, metric) => {
  const value = parseJson(plan.limits)[metric];
  if (value === undefined || value === null || Number(value) < 0) return null;
  return Number(value);
};

// Assert tenant usage allowance.
const assertUsageAvailable = async ({ clinicId, metric, increment = 1, connection }) => {
  if (!clinicId) throw new ApiError(400, 'clinicId is required');
  const plan = await repository.findActivePlanForUpdate(clinicId, connection);
  if (!plan) throw new ApiError(402, 'Active subscription required');
  const limit = resolveLimit(plan, metric);
  if (limit === null) return { plan, limit: null, usage: null };
  const usage = await repository.getMetricUsage(clinicId, metric, connection);
  if (usage + Number(increment) > limit) throw new ApiError(402, `${metric} subscription limit reached`);
  return { plan, limit, usage };
};

// Assert usage inside transaction.
const assertUsage = async ({ clinicId, metric, increment = 1 }) => runInTransaction(
  (connection) => assertUsageAvailable({ clinicId, metric, increment, connection }),
);

// Fetch tenant usage summary.
const getUsageSummary = async (clinicId) => {
  const plan = await repository.findActivePlan(clinicId);
  if (!plan) throw new ApiError(404, 'Active subscription not found');
  const limits = parseJson(plan.limits);
  const usage = {};
  for (const metric of usageMetrics) usage[metric] = await repository.getMetricUsage(clinicId, metric);
  return {
    subscription: { id: plan.id, status: plan.status, startsAt: plan.starts_at, endsAt: plan.ends_at },
    plan: { code: plan.code, name: plan.name, limits, features: parseJson(plan.features) },
    usage,
  };
};

module.exports = { assertUsageAvailable, assertUsage, resolveLimit, getUsageSummary };
