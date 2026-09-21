import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using the MONGODB_URI environment variable.
 * Exits the process if the connection fails.
 */
let isConnecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return isConnecting;
  }

  const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const hasEnvUri = process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string';

  if (!hasEnvUri && isProd) {
    const missingErr = new Error('MONGODB_URI environment variable is not configured in Vercel project settings.');
    console.error(`MongoDB connection error: ${missingErr.message}`);
    throw missingErr;
  }

  const uri = hasEnvUri
    ? process.env.MONGODB_URI
    : 'mongodb://127.0.0.1:27017/testforge';

  try {
    isConnecting = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    const conn = await isConnecting;
    console.log('MongoDB connected successfully');
    console.log(`Database host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnecting = null;
    console.error(`MongoDB connection error: ${error.message}`);
    throw new Error(`Database connection failed (${error.message}). Please check MONGODB_URI in Vercel settings and allow 0.0.0.0/0 in MongoDB Atlas Network Access.`);
  }
};

export default connectDB;
