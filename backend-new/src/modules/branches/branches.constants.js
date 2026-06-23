/**
 * Branches Constants
 * Defines branch lifecycle states and event names.
 */

const BRANCH_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

const BRANCH_ACTION = Object.freeze({
  CREATED: 'branch.created',
  UPDATED: 'branch.updated',
  STATUS_CHANGED: 'branch.status_changed',
  PRIMARY_CHANGED: 'branch.primary_changed',
});

const BRANCH_OUTBOX_EVENT = Object.freeze({
  CREATED: 'branch.created.v1',
  STATUS_CHANGED: 'branch.status_changed.v1',
});

// Checks whether a branch can accept writes.
const branchCanWrite = (branch) => branch && branch.status === BRANCH_STATUS.ACTIVE && !branch.is_deleted;

module.exports = {
  BRANCH_ACTION,
  BRANCH_OUTBOX_EVENT,
  BRANCH_STATUS,
  branchCanWrite,
};
