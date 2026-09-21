import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using the MONGODB_URI environment variable.
 * Exits the process if the connection fails.
 */
const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI &&
    process.env.MONGODB_URI !== 'your_mongodb_connection_string'
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/testforge';
  try {
    const conn = await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
    console.log(`Database host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
