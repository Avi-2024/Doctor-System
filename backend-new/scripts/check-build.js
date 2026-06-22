/**
 * Build Check Script
 * Validates Prisma schema and JavaScript syntax without generating migrations.
 */

const { spawnSync } = require('node:child_process');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'mysql://user:password@localhost:3306/doctor_system_build';
}
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'build-access-secret-32-characters-min';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'build-refresh-secret-32-characters-min';
process.env.AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE || 'false';

const run = (command, args) => {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
};

run('npx', ['prisma', 'validate']);
run('npm', ['run', 'check:syntax']);
