/**
 * WhatsApp Controller
 * Maps Meta webhook and message requests.
 */

const service = require('./whatsapp.service');
const { env } = require('../../config/env');
const { ApiError } = require('../../common/errors/ApiError');
const { successResponse } = require('../../common/utils/response');

// Verify Meta webhook.
const verifyWebhook = (req, res) => {
  if (req.query['hub.mode'] !== 'subscribe' || req.query['hub.verify_token'] !== env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) throw new ApiError(403, 'Webhook verification failed');
  return res.status(200).send(req.query['hub.challenge']);
};

// Receive signed Meta webhook.
const receiveWebhook = async (req, res) => {
  service.verifySignature(req.body, req.headers['x-hub-signature-256']);
  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch (error) {
    throw new ApiError(400, 'Invalid WhatsApp webhook payload');
  }
  const result = await service.processWebhook(payload);
  return successResponse(res, 'Webhook accepted', result);
};

// Queue outbound message.
const queueMessage = async (req, res) => {
  const result = await service.queueMessage(req.body, { clinicId: req.tenant.clinicId, userId: req.auth.userId });
  return successResponse(res, 'Message queued', result, undefined, 201);
};

// Send queued message.
const sendMessage = async (req, res) => {
  const result = await service.sendMessage(req.params.id, { clinicId: req.tenant.clinicId, userId: req.auth.userId });
  return successResponse(res, 'Message sent', result);
};

module.exports = { verifyWebhook, receiveWebhook, queueMessage, sendMessage };
