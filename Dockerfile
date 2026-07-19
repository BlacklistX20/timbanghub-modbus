FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Jalankan file utama
CMD ["node", "index.js"]