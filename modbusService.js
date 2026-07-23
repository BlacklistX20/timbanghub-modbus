require('dotenv').config();
const ModbusRTU = require("modbus-serial");

// 1. IMPORT KONEKSI DB & MODEL DARI FOLDER CONFIG
const connectDB = require("./config/db"); // Sesuaikan nama file jika bukan db.js
const { Timbangan1, Timbangan2, Timbangan3, Timbangan4 } = require("./config/Timbangan");

// 2. Masukkan ke dalam objek agar mudah di-looping
const models = {
  1: Timbangan1,
  2: Timbangan2,
  3: Timbangan3,
  4: Timbangan4,
};

// --- 2. KONFIGURASI MODBUS USR ---
// Anda juga bisa memindahkan IP ini ke .env di kemudian hari jika mau
const USR_IP = process.env.USR_IP; 
const USR_PORT = process.env.USR_PORT;
const SLAVES = [1, 2, 3, 4];
const REGISTER_ADDRESS = 4;

const client = new ModbusRTU();

// --- 3. FUNGSI UPDATE STATUS ---
const updateStatus = async (slaveId, status, message) => {
  const Model = models[slaveId];
  
  await Model.findOneAndUpdate(
    { status: { $exists: true } }, 
    {
      dateTime: getFormattedDate(),
      status: status,
      message: message
    },
    { upsert: true, returnDocument: 'after' }
  );
};

// --- FUNGSI FORMAT WAKTU (Otomatis menyesuaikan Timezone) ---
const getFormattedDate = () => {
  const dateString = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Makassar", 
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  return dateString.replace(/\./g, ':').replace(',', '');
};

// --- FUNGSI MENARIK DATA PER SLAVE ---
const readSlaveData = async (slaveId) => {
  const Model = models[slaveId];

  try {
    client.setID(slaveId);

    // Membaca Input Register (FC 04)
    const response = await client.readInputRegisters(REGISTER_ADDRESS, 1);
    const weightValue = response.data[0] / 100; 

    if (weightValue > 40 && weightValue < 55) {
        await Model.create({
            dateTime: getFormattedDate(),
            weight: weightValue
        });
        console.log(`[Slave ${slaveId}] DISIMPAN - Berat: ${weightValue} kg`);
    } else {
        console.log(`[Slave ${slaveId}] Berat di luar rentang, tidak disimpan: ${weightValue} kg`);
    }

    await updateStatus(slaveId, "running", "Data berhasil ditarik");

  } catch (error) {
    await updateStatus(slaveId, "stopped", `Gagal membaca register: ${error.message}`);
    console.log(`[Slave ${slaveId}] Gagal - ${error.message}`);
  }
};

// --- 5. FUNGSI POLLING SEKUENSIAL UTAMA ---
const startPolling = async () => {
  try {
    await client.connectTcpRTUBuffered(USR_IP, { port: USR_PORT });
    client.setTimeout(3000); 
    console.log(`Terhubung ke USR Modbus Gateway di IP ${USR_IP}!`);

    const pollLoop = async () => {
      if (!client.isOpen) {
        console.log("Koneksi TCP ke USR terputus. Mencoba menghubungkan ulang...");
        try {
          await client.connectTcpRTUBuffered(USR_IP, { port: USR_PORT });
          console.log("Berhasil terhubung kembali ke USR!");
        } catch (reconnectError) {
          console.log("Gagal menghubungkan ulang:", reconnectError.message);
          
          for (const slaveId of SLAVES) {
            await updateStatus(slaveId, "stopped", "Koneksi gateway terputus");
          }
          
          setTimeout(pollLoop, 5000);
          return; 
        }
      }

      for (const slaveId of SLAVES) {
        await readSlaveData(slaveId); 
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      
      setTimeout(pollLoop, 2000); 
    };

    pollLoop();

  } catch (error) {
    console.error("Gagal terhubung ke Modbus Gateway USR di awal:", error.message);
    setTimeout(startPolling, 10000);
  }
};

// ==============================================================================
// 6. INISIALISASI DATABASE & START WORKER
// ==============================================================================

console.log("Memulai Modbus Worker Service...");

// Menjalankan fungsi connectDB dari folder config
connectDB().then(() => {
  console.log("Memulai proses penarikan data dari Timbangan...");
  // Mulai polling Modbus HANYA jika database sudah berhasil terkoneksi
  startPolling();
});