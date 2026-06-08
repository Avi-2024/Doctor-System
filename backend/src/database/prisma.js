/**
 * Prisma Database Client
 * Provides ORM access and transaction boundaries.
 */

const { PrismaClient, Prisma } = require('@prisma/client');
const { env } = require('../config/env');

// Encode database URL component.
const encode = (value) => encodeURIComponent(String(value || ''));

// Build MySQL connection URL.
const buildDatabaseUrl = () => process.env.DATABASE_URL || `mysql://${encode(env.MYSQL_USER)}:${encode(env.MYSQL_PASSWORD)}@${env.MYSQL_HOST}:${env.MYSQL_PORT}/${encode(env.MYSQL_DATABASE)}`;

process.env.DATABASE_URL = buildDatabaseUrl();

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  errorFormat: env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
});

// Resolve Prisma model delegate.
const model = (client, modelName) => {
  const delegate = client[modelName];
  if (!delegate) throw new Error(`Unknown Prisma model: ${modelName}`);
  return delegate;
};

// Execute callback inside serializable transaction.
const transaction = async (callback) => prisma.$transaction(
  (client) => callback(client),
  { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 },
);

// Check database readiness.
const ping = async () => {
  await prisma.$queryRaw`SELECT 1`;
  return true;
};

// Close Prisma connection pool.
const close = async () => prisma.$disconnect();

module.exports = { prisma, model, transaction, ping, close };
