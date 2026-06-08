/**
 * Notification Worker
 * Continuously processes queued notification batches.
 */

const { env } = require('../src/config/env');
const { close } = require('../src/database/prisma');
const { processBatch } = require('./process-notifications');
const logger = require('../src/common/utils/logger');

let stopping = false;

// Wait configured duration.
const sleep = async (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Process notification batches continuously.
const work = async () => {
  while (!stopping) {
    try {
      logger.info('Notification batch processed', await processBatch());
    } catch (error) {
      logger.error('Notification worker batch failed', { error: error.message });
    }
    if (!stopping) await sleep(env.NOTIFICATION_POLL_INTERVAL_MS);
  }
};

// Gracefully stop worker.
const shutdown = async (signal) => {
  stopping = true;
  logger.info('Notification worker stopping', { signal });
  await close();
};

work();
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
