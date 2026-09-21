import 'dotenv/config';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

export default async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless MongoDB connection error:', err.message);
    if (req.url.startsWith('/api/') && !res.headersSent) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Database connection error. Please allow 0.0.0.0/0 in MongoDB Atlas Network Access.',
      });
    }
  }
  return app(req, res);
}
