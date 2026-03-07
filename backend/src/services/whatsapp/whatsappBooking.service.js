const Clinic = require('../../models/Clinic.model');
const ClinicTiming = require('../../models/ClinicTiming.model');
const Notification = require('../../models/Notification.model');
const appointmentService = require('../appointment/appointment.service');
const {
  buildOpenAutoReply,
  buildClosedAutoReply,
  buildInvalidBookingReply,
  buildAppointmentConfirmation,
} = require('./whatsappTemplates');

/**
 * Flow comments:
 * 1) Webhook arrives with inbound number metadata.to.
 * 2) Resolve clinic by its WhatsApp number for multi-clinic support.
 * 3) Parse message content:
 *    - HELP/HI: auto-reply based on clinic timing.
 *    - BOOK|... : parse booking details and create appointment.
 * 4) Send confirmation/response as Notification record (channel=whatsapp).
 */

const normalizePhone = (value = '') => value.replace(/[^\d+]/g, '');

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const getClinicByInboundNumber = async (inboundToNumber) => {
  const normalized = normalizePhone(inboundToNumber);
  return Clinic.findOne({
    isActive: true,
    $or: [
      { 'contact.whatsappNumber': inboundToNumber },
      { 'contact.whatsappNumber': normalized },
    ],
  });
};

const getClinicOpenState = async (clinicId, now = new Date()) => {
  const timing = await ClinicTiming.findOne({ clinicId, isDefault: true });
  if (!timing) {
    return { isOpenNow: true, nextOpenText: '' };
  }

  const day = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const today = timing.weeklySchedule.find((d) => d.dayOfWeek === day);
  if (today && today.isOpen) {
    for (const slot of today.slots) {
      if (currentMinutes >= toMinutes(slot.startTime) && currentMinutes <= toMinutes(slot.endTime)) {
        return { isOpenNow: true, nextOpenText: '' };
      }
    }
  }

  for (let i = 1; i <= 7; i += 1) {
    const nextDay = (day + i) % 7;
    const next = timing.weeklySchedule.find((d) => d.dayOfWeek === nextDay && d.isOpen && d.slots.length > 0);
    if (next) {
      return { isOpenNow: false, nextOpenText: `Day ${nextDay} at ${next.slots[0].startTime}` };
    }
  }

  return { isOpenNow: false, nextOpenText: '' };
};

const parseBookingMessage = (messageText) => {
  const text = (messageText || '').trim();
  if (!text.toUpperCase().startsWith('BOOK|')) {
    return null;
  }

  const parts = text.split('|').slice(1);
  const map = {};

  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toUpperCase();
    const value = part.slice(idx + 1).trim();
    map[key] = value;
  }

  if (!map.PATIENT || !map.DOCTOR || !map.DATE || !map.START || !map.END) {
    return null;
  }

  return {
    patientId: map.PATIENT,
    doctorId: map.DOCTOR,
    appointmentDate: map.DATE,
    startTime: map.START,
    endTime: map.END,
    reason: map.REASON || 'Booked via WhatsApp',
  };
};

const queueOutgoingWhatsapp = async ({ clinicId, recipient, type, payload }) =>
  Notification.create({
    clinicId,
    type,
    channel: 'whatsapp',
    recipient,
    payload,
    status: 'queued',
  });

const handleIncomingWhatsapp = async ({ from, to, messageText }) => {
  const clinic = await getClinicByInboundNumber(to);
  if (!clinic) {
    return {
      status: 'ignored',
      message: 'No clinic mapped for this WhatsApp number',
    };
  }

  const upper = (messageText || '').trim().toUpperCase();
  const openState = await getClinicOpenState(clinic._id);

  if (upper === 'HI' || upper === 'HELLO' || upper === 'HELP') {
    const autoReply = openState.isOpenNow
      ? buildOpenAutoReply({ clinicName: clinic.name })
      : buildClosedAutoReply({ clinicName: clinic.name, nextOpenText: openState.nextOpenText });

    await queueOutgoingWhatsapp({
      clinicId: clinic._id,
      recipient: from,
      type: 'general',
      payload: { text: autoReply, template: openState.isOpenNow ? 'AUTO_REPLY_OPEN' : 'AUTO_REPLY_CLOSED' },
    });

    return {
      status: 'auto_replied',
      clinicId: clinic._id,
      isOpenNow: openState.isOpenNow,
    };
  }

  const parsed = parseBookingMessage(messageText);
  if (!parsed) {
    await queueOutgoingWhatsapp({
      clinicId: clinic._id,
      recipient: from,
      type: 'general',
      payload: { text: buildInvalidBookingReply(), template: 'INVALID_BOOKING_FORMAT' },
    });

    return {
      status: 'invalid_format',
      clinicId: clinic._id,
    };
  }

  const appointment = await appointmentService.bookAppointment({
    clinicId: clinic._id,
    doctorId: parsed.doctorId,
    patientId: parsed.patientId,
    bookedBy: null,
    appointmentDate: parsed.appointmentDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    source: 'whatsapp',
    reason: parsed.reason,
    type: 'new',
  });

  const confirmation = buildAppointmentConfirmation({
    clinicName: clinic.name,
    appointmentDate: parsed.appointmentDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    bookingContext: appointment.bookingContext,
  });

  await queueOutgoingWhatsapp({
    clinicId: clinic._id,
    recipient: from,
    type: 'appointment_confirmation',
    payload: {
      text: confirmation,
      template: 'APPOINTMENT_CONFIRMATION',
      appointmentId: appointment._id,
    },
  });

  return {
    status: 'booked',
    clinicId: clinic._id,
    appointmentId: appointment._id,
    bookingContext: appointment.bookingContext,
  };
};

module.exports = {
  handleIncomingWhatsapp,
  parseBookingMessage,
};
