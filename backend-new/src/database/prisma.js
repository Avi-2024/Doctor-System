/**
 * Prisma Database Client
 * Owns connection lifecycle and transaction entrypoints.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ping = async () => {
  await prisma.$queryRaw`SELECT 1`;
  return true;
};

const close = async () => {
  await prisma.$disconnect();
};

const transaction = async (callback, options = {}) => {
  return prisma.$transaction((tx) => callback(tx), {
    maxWait: options.maxWait || 5000,
    timeout: options.timeout || 15000,
    isolationLevel: options.isolationLevel,
  });
};

const model = (client, name) => {
  const delegate = client[name];
  if (!delegate) throw new Error(`Unknown Prisma model delegate: ${name}`);
  return delegate;
};

module.exports = { prisma, ping, close, transaction, model };
