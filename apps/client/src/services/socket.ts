import { io, Socket } from 'socket.io-client';

export const SOCKET_EVENTS = {
  RUN_QUEUED: 'run:queued',
  RUN_STARTED: 'run:started',
  STEP_STARTED: 'step:started',
  STEP_PASSED: 'step:passed',
  STEP_FAILED: 'step:failed',
  RUN_COMPLETED: 'run:completed',
  RUN_FAILED: 'run:failed',
  JOIN_RUN: 'join:run',
  LEAVE_RUN: 'leave:run',
} as const;

let socket: Socket | null = null;

/**
 * Returns the singleton Socket.IO client instance, initializing connection if not created.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const getDefaultSocketUrl = () => {
      if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
      if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        return 'https://testforge-server.vercel.app';
      }
      return 'http://localhost:5000';
    };
    const rawUrl = getDefaultSocketUrl();
    const socketUrl = rawUrl.replace(/\/api\/?$/, '');
    const token = localStorage.getItem('token');

    socket = io(socketUrl, {
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to server with ID:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket.IO Client] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.IO Client] Connection error:', error.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

/**
 * Emits room join event for the specified runId.
 */
export const joinRunRoom = (runId: string): void => {
  const s = getSocket();
  if (s.connected) {
    s.emit(SOCKET_EVENTS.JOIN_RUN, { runId });
  } else {
    s.once('connect', () => {
      s.emit(SOCKET_EVENTS.JOIN_RUN, { runId });
    });
  }
};

/**
 * Emits room leave event for the specified runId.
 */
export const leaveRunRoom = (runId: string): void => {
  if (socket && socket.connected) {
    socket.emit(SOCKET_EVENTS.LEAVE_RUN, { runId });
  }
};

/**
 * Disconnects the socket connection cleanly.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
