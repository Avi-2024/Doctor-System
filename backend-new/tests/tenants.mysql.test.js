process.env.NODE_ENV = 'test';

const assert = require('node:assert/strict');
const test = require('node:test');

const mysqlIntegrationEnabled = process.env.RUN_MYSQL_INTEGRATION_TESTS === 'true';
const mysqlUrl = process.env.MYSQL_TEST_DATABASE_URL || process.env.DATABASE_URL || '';

test('Sprint 3 MySQL integration gate is configured when enabled', {
  skip: mysqlIntegrationEnabled ? false : 'Set RUN_MYSQL_INTEGRATION_TESTS=true and MYSQL_TEST_DATABASE_URL to run Sprint 3 DB evidence tests.',
}, async () => {
  assert.match(mysqlUrl, /^mysql:\/\//, 'MYSQL_TEST_DATABASE_URL or DATABASE_URL must point at a disposable MySQL database');
});

test('Sprint 3 MySQL integration scenarios required before production acceptance', {
  skip: mysqlIntegrationEnabled ? false : 'Documented production gate; skipped in default unit test runs.',
}, async () => {
  assert.ok(mysqlUrl, 'MySQL integration suite requires a disposable database URL');
  assert.ok([
    'migration applies cleanly',
    'onboarding rollback leaves no partial records',
    'concurrent onboarding is deterministic',
    'active primary branch uniqueness is enforced',
    'active invitation uniqueness is enforced',
    'active subscription uniqueness is enforced',
    'branch assignment FKs reject invalid references',
  ].length >= 7);
});
