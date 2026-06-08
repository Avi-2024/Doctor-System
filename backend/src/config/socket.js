/**
 * Socket Configuration
 * Registers authenticated clinic rooms.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { env } = require('./env');
const { prisma } = require('../database/prisma');

let io;

// Configure Socket.IO server.
const configureSocket = (server) => {
  io = new Server(server, { cors: { origin: env.CORS_ALLOWED_ORIGINS.split(','), credentials: true } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const user = await prisma.users.findFirst({
        where: { id: decoded.sub, is_active: true, is_deleted: false },
        select: { id: true, clinic_id: true, role: true },
      });
      if (!user) return next(new Error('Invalid session'));
      if (user.role !== 'SUPER_ADMIN') {
        const clinic = await prisma.clinics.findFirst({ where: { id: user.clinic_id, status: 'ACTIVE', is_deleted: false }, select: { id: true } });
        if (!clinic) return next(new Error('Invalid session'));
      }
      socket.data.auth = user;
      return next();
    } catch (error) {
      return next(new Error('Invalid access token'));
    }
  });
  io.on('connection', (socket) => {
    if (socket.data.auth.clinic_id) socket.join(`clinic:${socket.data.auth.clinic_id}`);
  });
  return io;
};

// Emit clinic event.
const emitClinicEvent = (clinicId, event, payload) => {
  if (io && clinicId) io.to(`clinic:${clinicId}`).emit(event, payload);
};

module.exports = { configureSocket, emitClinicEvent };
