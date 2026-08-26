import mongoose from 'mongoose';
import dns from 'dns';

// Use Google's DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.error(' Make sure your MongoDB Atlas password is correct and your IP is whitelisted.');
    process.exit(1);
  }
};

export default connectDB;
