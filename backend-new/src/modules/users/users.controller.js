/**
 * Users Controller
 * Handles HTTP response concerns for user endpoints.
 */

const { successResponse } = require('../../common/utils/response');

const createUsersController = ({ service }) => ({
  me: async (req, res) => {
    const result = await service.getCurrentUser({ context: req.context });
    return successResponse(res, 'Current user', result);
  },
});

module.exports = { createUsersController };
