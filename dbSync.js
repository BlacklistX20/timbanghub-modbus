require('dotenv').config();
const dns = require("dns").promises;
const { AtlasModels, LocalModels } = require("./config/Timbangan");

const SLAVES = [1, 2, 3, 4];
let isSyncing = false;

// --- FUNGSI CEK INTERNET ---
const checkInternet = async () => {
  try {
    await dns.lookup('google.com');
    return true;
  } catch (error) {
    return false;
  }
};

// --- FUNGSI SINKRONISASI ---
const syncLocalToAtlas = async () => {
  if (isSyncing) return; // Cegah tumpang tindih proses jika data sangat banyak
  isSyncing = true;

  try {
    const isOnline = await checkInternet();
    
    // Jika offline, hentikan proses sinkronisasi
    if (!isOnline) {
      isSyncing = false;
      return; 
    }

    for (const slaveId of SLAVES) {
      const LocalModel = LocalModels[slaveId];
      const AtlasModel = AtlasModels[slaveId];

      // Tarik data yang memiliki field weight dari database lokal
      const unsyncedData = await LocalModel.find({ weight: { $exists: true } });

      if (unsyncedData.length > 0) {
        console.log(`[Sync] Menemukan ${unsyncedData.length} data offline untuk Slave ${slaveId}...`);
        
        // Hapus _id bawaan lokal agar Atlas membuat _id baru
        const dataToInsert = unsyncedData.map(doc => {
          const obj = doc.toObject();
          delete obj._id; 
          return obj;
        });

        // Simpan ke Atlas
        await AtlasModel.insertMany(dataToInsert);
        
        // Hapus dari Lokal jika berhasil terkirim
        const docIds = unsyncedData.map(doc => doc._id);
        await LocalModel.deleteMany({ _id: { $in: docIds } });
        
        console.log(`[Sync] Berhasil mengirim & menghapus ${unsyncedData.length} data lokal Slave ${slaveId}`);
      }
    }
  } catch (error) {
    console.error(`[Sync] Gagal melakukan sinkronisasi: ${error.message}`);
  } finally {
    isSyncing = false;
  }
};

console.log("Memulai Service Sinkronisasi (Lokal -> Atlas)...");

// Beri jeda 3 detik di awal agar koneksi DB stabil, lalu cek setiap 10 detik
setTimeout(() => {
  setInterval(syncLocalToAtlas, 10000);
}, 3000);