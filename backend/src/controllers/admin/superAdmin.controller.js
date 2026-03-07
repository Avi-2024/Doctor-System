const mongoose = require('mongoose');
const Clinic = require('../../models/Clinic.model');
const User = require('../../models/User.model');
const Patient = require('../../models/Patient.model');
const Billing = require('../../models/Billing.model');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const listClinics = async (req, res, next) => {
  try {
    const { status } = req.query;

    const clinicFilter = {};
    if (status === 'active') clinicFilter.isActive = true;
    if (status === 'inactive') clinicFilter.isActive = false;

    const clinics = await Clinic.find(clinicFilter)
      .select('name code contact isActive subscriptionStatus planName createdAt')
      .sort({ createdAt: -1 });

    const clinicIds = clinics.map((c) => c._id);

    const [doctorCounts, patientCounts, revenueByClinic] = await Promise.all([
      User.aggregate([
        { $match: { clinicId: { $in: clinicIds }, role: 'DOCTOR', isActive: true } },
        { $group: { _id: '$clinicId', count: { $sum: 1 } } },
      ]),
      Patient.aggregate([
        { $match: { clinicId: { $in: clinicIds }, isActive: true } },
        { $group: { _id: '$clinicId', count: { $sum: 1 } } },
      ]),
      Billing.aggregate([
        { $match: { clinicId: { $in: clinicIds }, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: '$clinicId',
            totalBilled: { $sum: '$grandTotal' },
            totalCollected: { $sum: '$amountPaid' },
            totalDue: { $sum: '$amountDue' },
          },
        },
      ]),
    ]);

    const doctorMap = new Map(doctorCounts.map((d) => [String(d._id), d.count]));
    const patientMap = new Map(patientCounts.map((p) => [String(p._id), p.count]));
    const revenueMap = new Map(revenueByClinic.map((r) => [String(r._id), r]));

    const data = clinics.map((clinic) => {
      const revenue = revenueMap.get(String(clinic._id)) || { totalBilled: 0, totalCollected: 0, totalDue: 0 };

      return {
        id: clinic._id,
        name: clinic.name,
        code: clinic.code,
        contact: clinic.contact,
        isActive: clinic.isActive,
        subscriptionStatus: clinic.subscriptionStatus || 'unknown',
        planName: clinic.planName || 'N/A',
        doctorsCount: doctorMap.get(String(clinic._id)) || 0,
        patientsCount: patientMap.get(String(clinic._id)) || 0,
        revenueOverview: revenue,
        createdAt: clinic.createdAt,
      };
    });

    return res.status(200).json({
      totalClinics: data.length,
      filters: { status: status || 'all' },
      clinics: data,
    });
  } catch (error) {
    return next(error);
  }
};

const getClinicSummary = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    if (!mongoose.isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Invalid clinicId' });
    }

    const clinic = await Clinic.findById(clinicId).select('name code isActive subscriptionStatus planName contact settings');
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const [doctorsCount, patientsCount, revenue] = await Promise.all([
      User.countDocuments({ clinicId: toObjectId(clinicId), role: 'DOCTOR', isActive: true }),
      Patient.countDocuments({ clinicId: toObjectId(clinicId), isActive: true }),
      Billing.aggregate([
        { $match: { clinicId: toObjectId(clinicId), status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: '$grandTotal' },
            totalCollected: { $sum: '$amountPaid' },
            totalDue: { $sum: '$amountDue' },
            totalInvoices: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      clinic,
      doctorsCount,
      patientsCount,
      revenueOverview: revenue[0] || { totalBilled: 0, totalCollected: 0, totalDue: 0, totalInvoices: 0 },
    });
  } catch (error) {
    return next(error);
  }
};

const updateClinicActiveStatus = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(clinicId)) {
      return res.status(400).json({ message: 'Invalid clinicId' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive boolean is required' });
    }

    const clinic = await Clinic.findByIdAndUpdate(clinicId, { isActive }, { new: true }).select(
      'name code isActive subscriptionStatus planName updatedAt'
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    return res.status(200).json({
      message: `Clinic ${isActive ? 'enabled' : 'disabled'} successfully`,
      clinic,
    });
  } catch (error) {
    return next(error);
  }
};

const getPlatformRevenueOverview = async (req, res, next) => {
  try {
    const summary = await Billing.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalBilled: { $sum: '$grandTotal' },
          totalCollected: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
          invoicesCount: { $sum: 1 },
        },
      },
    ]);

    const clinicBreakdown = await Billing.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$clinicId',
          totalBilled: { $sum: '$grandTotal' },
          totalCollected: { $sum: '$amountPaid' },
          totalDue: { $sum: '$amountDue' },
        },
      },
      {
        $lookup: {
          from: 'clinics',
          localField: '_id',
          foreignField: '_id',
          as: 'clinic',
        },
      },
      { $unwind: { path: '$clinic', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          clinicId: '$_id',
          clinicName: '$clinic.name',
          clinicCode: '$clinic.code',
          totalBilled: 1,
          totalCollected: 1,
          totalDue: 1,
        },
      },
      { $sort: { totalCollected: -1 } },
    ]);

    return res.status(200).json({
      platformRevenue: summary[0] || {
        totalBilled: 0,
        totalCollected: 0,
        totalDue: 0,
        invoicesCount: 0,
      },
      clinicBreakdown,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listClinics,
  getClinicSummary,
  updateClinicActiveStatus,
  getPlatformRevenueOverview,
};
