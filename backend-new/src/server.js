/**
 * HTTP Server Entrypoint
 * Starts Express and validates database readiness.
 */

const http = require('http');
const app = require('./app');
const { env } = require('./config/env');
const { ping, close } = require('./database/prisma');
const logger = require('./common/utils/logger');

let server;

const start = async () => {
  await ping();
  server = http.createServer(app);
  server.listen(env.PORT, () => logger.info('HTTP server listening', { port: env.PORT }));
};

const shutdown = async (signal) => {
  logger.info('Shutdown requested', { signal });
  if (server) await new Promise((resolve) => server.close(resolve));
  await close();
};

const run = async () => {
  try {
    await start();
  } catch (error) {
    logger.error('Startup failed', { error: error.message });
    process.exitCode = 1;
  }
};

run();

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
