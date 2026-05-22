const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const injectClinicFromAuth = (req, res, next) => {
  const clinicId = req.auth?.clinicId?.toString();
  if (!clinicId) {
    return next();
  }

  if (methodsWithBody.has(req.method) && req.body && !req.body.clinicId) {
    req.body.clinicId = clinicId;
  }

  if (!req.query.clinicId) {
    req.query.clinicId = clinicId;
  }

  return next();
};

module.exports = {
  injectClinicFromAuth,
};
