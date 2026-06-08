/**
 * Payment Status Constants
 * Defines invoice payment states.
 */

const PAYMENT_STATUS = Object.freeze({
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
});

module.exports = { PAYMENT_STATUS };
