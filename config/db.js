const mongoose = require('mongoose');
require('dotenv').config();

// Membuat instance koneksi terpisah
const atlasDB = mongoose.createConnection(process.env.MONGO_URI_ATLAS);
const localDB = mongoose.createConnection(process.env.MONGO_URI_LOCAL);

// Event listener untuk Atlas
atlasDB.on('connected', () => console.log('MongoDB Atlas Berhasil Terhubung...'));
atlasDB.on('error', (err) => console.error('Koneksi MongoDB Atlas Gagal:', err.message));

// Event listener untuk Lokal
localDB.on('connected', () => console.log('MongoDB Lokal Berhasil Terhubung...'));
localDB.on('error', (err) => console.error('Koneksi MongoDB Lokal Gagal:', err.message));

module.exports = { atlasDB, localDB };