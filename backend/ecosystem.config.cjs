/**
 * PM2 Runtime Configuration
 * Runs API and notification worker processes.
 */

module.exports = {
  apps: [
    {
      name: 'doctor-system-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      kill_timeout: 10000,
      env_production: { NODE_ENV: 'production' },
    },
    {
      name: 'doctor-system-worker',
      script: 'scripts/notification-worker.js',
      instances: 1,
      max_memory_restart: '256M',
      kill_timeout: 10000,
      env_production: { NODE_ENV: 'production' },
    },
  ],
};
