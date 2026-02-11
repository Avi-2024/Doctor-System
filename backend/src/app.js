const express = require('express');
const v1Routes = require('./routes/v1');
const { errorHandler } = require('./middleware/error/errorHandler.middleware');

const app = express();

app.use('/api/v1/subscriptions/razorpay/webhook', express.raw({ type: '*/*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/v1', v1Routes);

app.use(errorHandler);

module.exports = app;
