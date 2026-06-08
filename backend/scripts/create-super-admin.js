/**
 * Super Admin Bootstrap
 * Creates initial platform administrator.
 */

const bcrypt = require('bcryptjs');
const { env } = require('../src/config/env');
const { prisma, close } = require('../src/database/prisma');
const { createId } = require('../src/common/utils/ids');
const logger = require('../src/common/utils/logger');

// Create platform administrator.
const run = async () => {
  try {
    if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD || !env.SUPER_ADMIN_NAME) throw new Error('Super admin environment values required');
    const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
    const existing = await prisma.users.findFirst({ where: { clinic_id: null, email, is_deleted: false } });
    if (existing) throw new Error('Super admin already exists');
    await prisma.users.create({
      data: {
        id: createId(),
        clinic_id: null,
        full_name: env.SUPER_ADMIN_NAME,
        email,
        password_hash: await bcrypt.hash(env.SUPER_ADMIN_PASSWORD, 12),
        role: 'SUPER_ADMIN',
        permissions: ['*'],
        is_active: true,
      },
    });
    logger.info('Super admin created');
  } catch (error) {
    logger.error('Super admin bootstrap failed', { error: error.message });
    process.exitCode = 1;
  } finally {
    await close();
  }
};

run();
