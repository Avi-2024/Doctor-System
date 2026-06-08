/**
 * Queue Status Constants
 * Defines waiting-room lifecycle states.
 */

const QUEUE_STATUS = Object.freeze({
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  NO_SHOW: 'NO_SHOW',
});

module.exports = { QUEUE_STATUS };
