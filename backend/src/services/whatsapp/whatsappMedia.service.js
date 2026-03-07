const FormData = require('form-data');

const getWhatsAppConfig = () => {
  const apiBase = process.env.WHATSAPP_API_BASE_URL || 'https://graph.facebook.com/v21.0';
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    const error = new Error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID');
    error.statusCode = 500;
    throw error;
  }

  return { apiBase, token, phoneNumberId };
};

const uploadMedia = async ({ fileBuffer, filename = 'prescription.pdf', mimeType = 'application/pdf' }) => {
  const { apiBase, token, phoneNumberId } = getWhatsAppConfig();

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', fileBuffer, { filename, contentType: mimeType });

  const response = await fetch(`${apiBase}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Failed to upload media to WhatsApp');
    error.statusCode = response.status;
    throw error;
  }

  return data;
};

const sendDocumentMessage = async ({ to, mediaId, filename = 'prescription.pdf', caption }) => {
  const { apiBase, token, phoneNumberId } = getWhatsAppConfig();

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      id: mediaId,
      filename,
      ...(caption ? { caption } : {}),
    },
  };

  const response = await fetch(`${apiBase}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || 'Failed to send WhatsApp document');
    error.statusCode = response.status;
    throw error;
  }

  return data;
};

const sendPdfViaWhatsApp = async ({ to, pdfBuffer, filename, caption }) => {
  const media = await uploadMedia({ fileBuffer: pdfBuffer, filename, mimeType: 'application/pdf' });
  const mediaId = media.id;

  const message = await sendDocumentMessage({
    to,
    mediaId,
    filename,
    caption,
  });

  return {
    media,
    message,
  };
};

module.exports = {
  uploadMedia,
  sendDocumentMessage,
  sendPdfViaWhatsApp,
};
