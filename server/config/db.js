const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/classoptima';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`\nMongoDB connection error: ${error.message}`);
    console.error('Check MONGO_URI in server/.env. For Atlas, also allow your IP under Network Access.\n');
    process.exit(1);
  }
};

module.exports = connectDB;
