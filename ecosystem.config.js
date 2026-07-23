module.exports = {
  apps: [
    {
      name: "modbus",
      script: "./modbusService.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "sync",
      script: "./dbSync.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};