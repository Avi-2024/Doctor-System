/**
 * Integration Test Runner
 * Runs MySQL integration tests cross-platform.
 */

const { spawnSync } = require('node:child_process');
const path = require('node:path');

// Build isolated MySQL test environment.
const buildTestEnvironment = () => {
  const database = process.env.MYSQL_TEST_DATABASE || '';
  if (!database.endsWith('_test')) throw new Error('MYSQL_TEST_DATABASE must end with _test');
  return {
    ...process.env,
    RUN_MYSQL_INTEGRATION: 'true',
    MYSQL_HOST: process.env.MYSQL_TEST_HOST || '127.0.0.1',
    MYSQL_PORT: process.env.MYSQL_TEST_PORT || '3306',
    MYSQL_DATABASE: database,
    MYSQL_USER: process.env.MYSQL_TEST_USER || 'root',
    MYSQL_PASSWORD: process.env.MYSQL_TEST_PASSWORD || '',
  };
};

// Run enabled MySQL integration tests.
const run = () => {
  const env = buildTestEnvironment();
  const migration = spawnSync(process.execPath, [path.join('scripts', 'migrate.js')], { cwd: path.join(__dirname, '..'), env, stdio: 'inherit' });
  if (migration.status !== 0) {
    process.exitCode = migration.status ?? 1;
    return;
  }
  const result = spawnSync(
    process.execPath,
    ['--test', '--test-concurrency=1', path.join('tests', 'mysql.integration.test.js')],
    { cwd: path.join(__dirname, '..'), env, stdio: 'inherit' },
  );
  process.exitCode = result.status ?? 1;
};

run();
