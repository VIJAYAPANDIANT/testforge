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

  const uri =
    process.env.MONGODB_URI &&
    process.env.MONGODB_URI !== 'your_mongodb_connection_string'
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/testforge';

  try {
    isConnecting = mongoose.connect(uri);
    const conn = await isConnecting;
    console.log('MongoDB connected successfully');
    console.log(`Database host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnecting = null;
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
