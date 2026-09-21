import 'dotenv/config';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless MongoDB connection error:', err.message);
    if (req.url.startsWith('/api/') && !res.headersSent) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Database connection error. Please verify MONGODB_URI in Vercel settings and allow 0.0.0.0/0 in MongoDB Atlas.',
      });
    }
  }
  return app(req, res);
}
