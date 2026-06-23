/**
 * Prisma Errors
 * Maps expected Prisma constraint errors into safe API errors.
 */

const { ApiError } = require('../errors/ApiError');

// Checks whether a thrown value looks like a Prisma known request error.
const isKnownPrismaError = (error) => Boolean(error && typeof error.code === 'string');

// Converts known Prisma errors into stable API errors.
const mapPrismaError = (error, {
  unique = 'Resource already exists',
  foreignKey = 'Related resource is invalid',
  notFound = 'Resource not found',
} = {}) => {
  if (!isKnownPrismaError(error)) return error;
  if (error.code === 'P2002') return new ApiError(409, unique);
  if (error.code === 'P2003') return new ApiError(409, foreignKey);
  if (error.code === 'P2025') return new ApiError(404, notFound);
  return error;
};

// Runs an async operation and maps expected Prisma errors.
const withPrismaErrorMapping = async (operation, options = {}) => {
  try {
    return await operation();
  } catch (error) {
    throw mapPrismaError(error, options);
  }
};

module.exports = {
  isKnownPrismaError,
  mapPrismaError,
  withPrismaErrorMapping,
};
