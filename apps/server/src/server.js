import 'dotenv/config';
import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {}
import http from 'node:http';
import app from './app.js';
import connectDB from './config/db.js';
import { initSocketServer } from './socket/index.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Attach Socket.IO to the Express HTTP server
initSocketServer(server);

/**
 * Bootstrap: connect to MongoDB, then start the HTTP server.
 */
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
