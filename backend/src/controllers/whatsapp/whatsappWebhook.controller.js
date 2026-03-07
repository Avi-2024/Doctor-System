const whatsappBookingService = require('../../services/whatsapp/whatsappBooking.service');

/**
 * Webhook handler supports generic payload shape:
 * {
 *   "from": "+9198...", // patient whatsapp
 *   "to": "+9112...",   // clinic whatsapp number
 *   "message": "BOOK|PATIENT:..."
 * }
 */
const handleWebhook = async (req, res, next) => {
  try {
    const from = req.body.from || req.body?.contacts?.[0]?.wa_id;
    const to = req.body.to || req.body?.metadata?.display_phone_number || req.body?.metadata?.to;
    const messageText =
      req.body.message ||
      req.body?.messages?.[0]?.text?.body ||
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (!from || !to || !messageText) {
      return res.status(400).json({
        message: 'Invalid webhook payload: from, to and message are required',
      });
    }

    const result = await whatsappBookingService.handleIncomingWhatsapp({
      from,
      to,
      messageText,
    });

    return res.status(200).json({
      message: 'Webhook processed',
      result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  handleWebhook,
};
