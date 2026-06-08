/**
 * Migration Runner
 * Applies pending MySQL SQL migrations.
 */

const fs = require('fs');
const path = require('path');
const { prisma, close } = require('../src/database/prisma');
const logger = require('../src/common/utils/logger');

const migrationsDirectory = path.join(__dirname, '..', 'src', 'database', 'migrations');

// Split SQL migration statements.
const splitStatements = (sql) => sql.split(/;\s*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean);

// Run pending migrations.
const migrate = async () => {
  await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(255) PRIMARY KEY, executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3))');
  const [{ locked }] = await prisma.$queryRawUnsafe('SELECT GET_LOCK(?, 30) AS locked', 'doctor_system_migrations');
  if (Number(locked) !== 1) throw new Error('Could not acquire migration lock');
  const executed = await prisma.$queryRawUnsafe('SELECT name FROM schema_migrations');
  const completed = new Set(executed.map((row) => row.name));
  const files = fs.readdirSync(migrationsDirectory).filter((file) => file.endsWith('.sql')).sort();

  try {
    for (const file of files) {
      if (completed.has(file)) continue;
      for (const statement of splitStatements(fs.readFileSync(path.join(migrationsDirectory, file), 'utf8'))) {
        await prisma.$executeRawUnsafe(statement);
      }
      await prisma.$executeRawUnsafe('INSERT INTO schema_migrations (name) VALUES (?)', file);
      logger.info('Migration applied', { file });
    }
  } finally {
    await prisma.$queryRawUnsafe('SELECT RELEASE_LOCK(?) AS released', 'doctor_system_migrations');
  }
};

// Run migration command.
const run = async () => {
  try {
    await migrate();
  } catch (error) {
    logger.error('Migration failed', { error: error.message });
    process.exitCode = 1;
  } finally {
    await close();
  }
};

run();
