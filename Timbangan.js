const mongoose = require('mongoose');

// Schema dengan deklarasi index untuk performa super cepat
const timbanganSchema = new mongoose.Schema({
  weight: { type: Number, index: true },
  status: { type: String, index: true },
  dateTime: { type: String, index: true }
}, { strict: false, versionKey: false });

// POLA PENCEGAHAN: Cek mongoose.models terlebih dahulu
const Timbangan1 = mongoose.models.Timbangan1 || mongoose.model("Timbangan1", timbanganSchema, "timbangan1");
const Timbangan2 = mongoose.models.Timbangan2 || mongoose.model("Timbangan2", timbanganSchema, "timbangan2");
const Timbangan3 = mongoose.models.Timbangan3 || mongoose.model("Timbangan3", timbanganSchema, "timbangan3");
const Timbangan4 = mongoose.models.Timbangan4 || mongoose.model("Timbangan4", timbanganSchema, "timbangan4");

// Ekspor model agar bisa dipakai di tempat lain
module.exports = {
  Timbangan1,
  Timbangan2,
  Timbangan3,
  Timbangan4
};