/**
 * Notification Processor
 * Delivers one batch of due WhatsApp notifications.
 */

const { close } = require('../src/database/prisma');
const { sendMessage, recoverStaleMessages, listDueMessages } = require('../src/modules/whatsapp/whatsapp.service');
const logger = require('../src/common/utils/logger');

// Process due notification batch.
const processBatch = async () => {
  await recoverStaleMessages();
  const notifications = await listDueMessages();
  let sent = 0;
  let failed = 0;
  for (const notification of notifications) {
    try {
      await sendMessage(notification.id, { clinicId: notification.clinic_id, userId: null });
      sent += 1;
    } catch (error) {
      logger.error('Notification delivery failed', { notificationId: notification.id, error: error.message });
      failed += 1;
    }
  }
  return { processed: notifications.length, sent, failed };
};

// Run notification processor.
const run = async () => {
  try {
    logger.info('Notification batch processed', await processBatch());
  } catch (error) {
    logger.error('Notification processor failed', { error: error.message });
    process.exitCode = 1;
  } finally {
    await close();
  }
};

if (require.main === module) run();

module.exports = { processBatch };
