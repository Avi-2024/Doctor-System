const express = require('express');
const whatsappWebhookController = require('../../controllers/whatsapp/whatsappWebhook.controller');

const router = express.Router();

// Meta/WhatsApp webhook endpoint
router.post('/webhook', whatsappWebhookController.handleWebhook);

module.exports = router;
