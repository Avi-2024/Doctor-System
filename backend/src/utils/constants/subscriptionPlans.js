const SUBSCRIPTION_PLANS = Object.freeze({
  BASIC: {
    name: 'BASIC',
    maxDoctors: 5,
    maxPatientsPerMonth: 500,
    maxWhatsappMessagesPerMonth: 1000,
  },
  PRO: {
    name: 'PRO',
    maxDoctors: 20,
    maxPatientsPerMonth: 3000,
    maxWhatsappMessagesPerMonth: 10000,
  },
  ENTERPRISE: {
    name: 'ENTERPRISE',
    maxDoctors: 1000,
    maxPatientsPerMonth: 100000,
    maxWhatsappMessagesPerMonth: 100000,
  },
});

module.exports = {
  SUBSCRIPTION_PLANS,
};
