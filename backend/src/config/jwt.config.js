const getRequired = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[config] Missing required environment variable: ${key}. Server cannot start.`);
  }
  return value;
};

const parseDurationToMs = (duration) => {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  const units = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * (units[unit] ?? 1_000);
};

const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

module.exports = {
  JWT_ACCESS_SECRET: getRequired('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: getRequired('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  ACCESS_COOKIE_MAX_AGE: parseDurationToMs(JWT_ACCESS_EXPIRES_IN),
  REFRESH_COOKIE_MAX_AGE: parseDurationToMs(JWT_REFRESH_EXPIRES_IN),
};
