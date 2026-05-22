const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config();

const PORT = Number(process.env.PORT) || 8080;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME;

const connectMongo = async () => {
  if (!MONGODB_URI) {
    console.warn('[startup] MONGODB_URI is empty. API will start without a database connection.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME || undefined,
    });
    console.log('[startup] MongoDB connected');
  } catch (error) {
    console.error(`[startup] MongoDB connection failed: ${error.message}`);
  }
};

const startServer = async () => {
  await connectMongo();

  app.listen(PORT, () => {
    console.log(`[startup] Backend listening on http://localhost:${PORT}`);
  });
};

startServer();
