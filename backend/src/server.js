/**
 * HTTP Server Entrypoint
 * Starts Express, MySQL, and Socket.IO.
 */

const http = require('http');
const { initSentry } = require('./config/sentry');

initSentry();

const app = require('./app');
const { env } = require('./config/env');
const { ping, close } = require('./database/prisma');
const { configureSocket } = require('./config/socket');
const logger = require('./common/utils/logger');

let server;
let io;

// Start HTTP server.
const start = async () => {
  await ping();
  server = http.createServer(app);
  io = configureSocket(server);
  server.listen(env.PORT, () => logger.info('HTTP server listening', { port: env.PORT }));
};

// Gracefully close runtime.
const shutdown = async (signal) => {
  logger.info('Shutdown requested', { signal });
  if (io) await new Promise((resolve) => io.close(resolve));
  if (server) await new Promise((resolve) => server.close(resolve));
  await close();
};

// Start server with explicit error handling.
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
