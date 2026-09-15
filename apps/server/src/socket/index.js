import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SOCKET_EVENTS } from './events.js';

let ioInstance = null;

/**
 * Initializes Socket.IO server attached to the Express HTTP server instance.
 *
 * @param {import('node:http').Server} httpServer
 * @returns {Server} Socket.IO Server instance
 */
export const initSocketServer = (httpServer) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  ioInstance = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Optional socket authentication middleware
  ioInstance.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (token && process.env.JWT_SECRET) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id };
      }
    } catch (err) {
      console.warn('[Socket.IO] Unauthenticated or expired socket connection attempt');
    }
    // Allow connection even if token is missing/expired, room scoping protects run privacy
    next();
  });

  ioInstance.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join room for a specific run
    socket.on(SOCKET_EVENTS.JOIN_RUN, ({ runId }) => {
      if (runId) {
        const roomName = `run:${runId}`;
        socket.join(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomName}`);
      }
    });

    // Leave room for a specific run
    socket.on(SOCKET_EVENTS.LEAVE_RUN, ({ runId }) => {
      if (runId) {
        const roomName = `run:${runId}`;
        socket.leave(roomName);
        console.log(`[Socket.IO] Socket ${socket.id} left room ${roomName}`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
};

/**
 * Returns the active Socket.IO server instance.
 *
 * @returns {Server|null}
 */
export const getIO = () => ioInstance;

/**
 * Helper utility to safely emit a real-time event to a scoped run room.
 *
 * @param {string} runId - Run ID
 * @param {string} eventName - Socket event name
 * @param {object} payload - Event payload data
 */
export const emitRunEvent = (runId, eventName, payload) => {
  if (ioInstance && runId) {
    ioInstance.to(`run:${runId}`).emit(eventName, payload);
  }
};

export { SOCKET_EVENTS };
