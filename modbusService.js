require('dotenv').config();
const ModbusRTU = require("modbus-serial");
const dns = require("dns").promises;

const { AtlasModels, LocalModels } = require("./config/Timbangan");

let isOnline = true;

const USR_IP = process.env.USR_IP; 
const USR_PORT = process.env.USR_PORT;
const SLAVES = [1, 2, 3, 4];
const REGISTER_ADDRESS = 4;
const client = new ModbusRTU();

const checkInternet = async () => {
  try {
    await dns.lookup('google.com');
    return true;
  } catch (error) {
    return false;
  }
};

const updateStatus = async (slaveId, status, message) => {
  const ActiveModels = isOnline ? AtlasModels : LocalModels;
  const Model = ActiveModels[slaveId];
  
  await Model.findOneAndUpdate(
    { status: { $exists: true } }, 
    { dateTime: getFormattedDate(), status: status, message: message },
    { upsert: true, returnDocument: 'after' }
  );
};

const getFormattedDate = () => {
  const dateString = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Makassar", 
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
  return dateString.replace(/\./g, ':').replace(',', '');
};

const readSlaveData = async (slaveId) => {
  const ActiveModels = isOnline ? AtlasModels : LocalModels;
  const Model = ActiveModels[slaveId];

  try {
    client.setID(slaveId);
    const response = await client.readInputRegisters(REGISTER_ADDRESS, 1);
    const weightValue = response.data[0] / 100; 

    if (weightValue > 40 && weightValue < 55) {
        await Model.create({ dateTime: getFormattedDate(), weight: weightValue });
        const dbStatus = isOnline ? "ATLAS" : "LOKAL";
        console.log(`[Slave ${slaveId}] DISIMPAN (${dbStatus}) - Berat: ${weightValue} kg`);
    }

    await updateStatus(slaveId, "running", "Data berhasil ditarik");

  } catch (error) {
    await updateStatus(slaveId, "stopped", `Gagal membaca register: ${error.message}`);
  }
};

const startPolling = async () => {
  try {
    await client.connectTcpRTUBuffered(USR_IP, { port: USR_PORT });
    client.setTimeout(3000); 
    console.log(`Terhubung ke USR Modbus Gateway di IP ${USR_IP}!`);

    const pollLoop = async () => {
      if (!client.isOpen) {
        console.log("Koneksi TCP terputus. Mencoba ulang...");
        try {
          await client.connectTcpRTUBuffered(USR_IP, { port: USR_PORT });
        } catch (reconnectError) {
          for (const slaveId of SLAVES) {
            await updateStatus(slaveId, "stopped", "Koneksi gateway terputus");
          }
          setTimeout(pollLoop, 1000);
          return; 
        }
      }

      for (const slaveId of SLAVES) {
        await readSlaveData(slaveId); 
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      setTimeout(pollLoop, 1000); 
    };

    pollLoop();
  } catch (error) {
    console.error("Gagal terhubung ke Gateway:", error.message);
    setTimeout(startPolling, 3000);
  }
};

console.log("Memulai Modbus Worker Service...");

// Cek internet setiap 2 detik HANYA untuk menentukan tujuan penyimpanan data
setInterval(async () => {
  const currentStatus = await checkInternet();
  if (currentStatus !== isOnline) {
    console.log(`[Network] Status Internet Berubah: ${currentStatus ? "ONLINE" : "OFFLINE"}`);
    isOnline = currentStatus;
  }
}, 2000);

setTimeout(startPolling, 2000);