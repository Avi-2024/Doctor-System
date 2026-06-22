/**
 * Foundation Validators
 * Exposes validator arrays for route consistency, even where no request fields exist.
 */

const healthValidators = [];
const readinessValidators = [];
const metaValidators = [];

module.exports = {
  healthValidators,
  metaValidators,
  readinessValidators,
};
