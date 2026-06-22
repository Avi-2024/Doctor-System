/**
 * Audit Repository
 * Persists immutable audit records.
 */

const { prisma, model } = require('../../database/prisma');

const delegateFor = (connection) => model(connection || prisma, 'audit_logs');
const chainDelegateFor = (connection) => model(connection || prisma, 'audit_chain_state');

const GLOBAL_AUDIT_CHAIN_SCOPE = 'global';

const findLatestAuditHash = async (connection) => {
  const latest = await delegateFor(connection).findFirst({
    where: { hash: { not: null } },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    select: { hash: true },
  });
  return latest?.hash || null;
};

const ensureAuditChainState = async (connection, chainScope = GLOBAL_AUDIT_CHAIN_SCOPE) => {
  return chainDelegateFor(connection).upsert({
    where: { chain_scope: chainScope },
    update: {},
    create: { chain_scope: chainScope },
  });
};

const lockAuditChainState = async (connection, chainScope = GLOBAL_AUDIT_CHAIN_SCOPE) => {
  await ensureAuditChainState(connection, chainScope);
  if (typeof connection?.$queryRawUnsafe === 'function') {
    const rows = await connection.$queryRawUnsafe(
      'SELECT latest_hash FROM audit_chain_state WHERE chain_scope = ? FOR UPDATE',
      chainScope,
    );
    return rows?.[0]?.latest_hash || null;
  }
  const state = await chainDelegateFor(connection).findUnique({
    where: { chain_scope: chainScope },
    select: { latest_hash: true },
  });
  return state?.latest_hash || null;
};

const updateAuditChainState = async (latestHash, connection, chainScope = GLOBAL_AUDIT_CHAIN_SCOPE) => {
  return chainDelegateFor(connection).update({
    where: { chain_scope: chainScope },
    data: { latest_hash: latestHash },
  });
};

const createAuditLog = async (payload, connection) => {
  return delegateFor(connection).create({ data: payload });
};

module.exports = {
  GLOBAL_AUDIT_CHAIN_SCOPE,
  createAuditLog,
  ensureAuditChainState,
  findLatestAuditHash,
  lockAuditChainState,
  updateAuditChainState,
};
