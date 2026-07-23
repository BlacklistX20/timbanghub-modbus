const mongoose = require('mongoose');
const { atlasDB, localDB } = require('./db'); 

// Schema dengan deklarasi index untuk performa
const timbanganSchema = new mongoose.Schema({
  weight: { type: Number, index: true },
  status: { type: String, index: true },
  message: { type: String },
  dateTime: { type: String, index: true }
}, { strict: false, versionKey: false });

// Model untuk MongoDB Atlas
const AtlasModels = {
  1: atlasDB.model("Timbangan1", timbanganSchema, "timbangan1"),
  2: atlasDB.model("Timbangan2", timbanganSchema, "timbangan2"),
  3: atlasDB.model("Timbangan3", timbanganSchema, "timbangan3"),
  4: atlasDB.model("Timbangan4", timbanganSchema, "timbangan4")
};

// Model untuk MongoDB Lokal
const LocalModels = {
  1: localDB.model("Timbangan1", timbanganSchema, "timbangan1"),
  2: localDB.model("Timbangan2", timbanganSchema, "timbangan2"),
  3: localDB.model("Timbangan3", timbanganSchema, "timbangan3"),
  4: localDB.model("Timbangan4", timbanganSchema, "timbangan4")
};

module.exports = { AtlasModels, LocalModels };