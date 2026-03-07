const { resolveTemplate } = require('./notificationTemplates');
const { NOTIFICATION_CHANNELS } = require('./notification.constants');
const { dispatchInApp, dispatchWhatsApp, dispatchSms } = require('./notificationChannels.service');

const channelDispatchers = {
  [NOTIFICATION_CHANNELS.IN_APP]: dispatchInApp,
  [NOTIFICATION_CHANNELS.WHATSAPP]: dispatchWhatsApp,
  [NOTIFICATION_CHANNELS.SMS]: dispatchSms,
};

const emitEvent = async ({ clinicId, event, recipients = [], context = {}, channels = [] }) => {
  if (!clinicId) {
    const error = new Error('clinicId is required for notification event');
    error.statusCode = 400;
    throw error;
  }

  if (!event) {
    const error = new Error('event is required for notification event');
    error.statusCode = 400;
    throw error;
  }

  const message = resolveTemplate(event, context);
  const usedChannels = channels.length > 0 ? channels : [NOTIFICATION_CHANNELS.IN_APP];

  const jobs = [];
  for (const recipient of recipients) {
    for (const channel of usedChannels) {
      const dispatcher = channelDispatchers[channel];
      if (!dispatcher) continue;

      jobs.push(
        dispatcher({
          clinicId,
          eventType: event,
          recipient,
          payload: {
            event,
            title: message.title,
            text: message.text,
            context,
          },
        })
      );
    }
  }

  const results = await Promise.all(jobs);
  return {
    event,
    channels: usedChannels,
    count: results.length,
    notifications: results,
  };
};

module.exports = {
  emitEvent,
};
