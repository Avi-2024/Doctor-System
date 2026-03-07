const mongoose = require('mongoose');
const AuditLog = require('../../models/AuditLog.model');

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const listAuditLogs = async (req, res, next) => {
  try {
    const {
      clinicId,
      action,
      actorUserId,
      from,
      to,
      statusCode,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    if (clinicId) {
      if (!mongoose.isValidObjectId(clinicId)) return res.status(400).json({ message: 'Invalid clinicId' });
      query.clinicId = clinicId;
    }

    if (actorUserId) {
      if (!mongoose.isValidObjectId(actorUserId)) return res.status(400).json({ message: 'Invalid actorUserId' });
      query.actorUserId = actorUserId;
    }

    if (action) query.action = action;

    if (statusCode) {
      const code = Number(statusCode);
      if (Number.isNaN(code)) return res.status(400).json({ message: 'Invalid statusCode' });
      query.statusCode = code;
    }

    const fromDate = parseDate(from);
    const toDate = parseDate(to);

    if (from && !fromDate) return res.status(400).json({ message: 'Invalid from date' });
    if (to && !toDate) return res.status(400).json({ message: 'Invalid to date' });

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDate) query.createdAt.$lte = toDate;
    }

    const parsedPage = Math.max(Number(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return res.status(200).json({
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      items,
    });
  } catch (error) {
    return next(error);
  }
};

const getAuditLogById = async (req, res, next) => {
  try {
    const { auditLogId } = req.params;

    if (!mongoose.isValidObjectId(auditLogId)) {
      return res.status(400).json({ message: 'Invalid auditLogId' });
    }

    const auditLog = await AuditLog.findById(auditLogId).lean();

    if (!auditLog) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    return res.status(200).json({ auditLog });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAuditLogs,
  getAuditLogById,
};
