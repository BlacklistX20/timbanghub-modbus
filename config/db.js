const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Terhubung Berhasil...');
  } catch (err) {
    console.error('Koneksi MongoDB Gagal:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;