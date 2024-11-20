# Gunakan node versi LTS
FROM node:20-slim

# Set direktori kerja di container
WORKDIR /usr/src/app

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy seluruh kode sumber
COPY . .

# Expose port 3001
EXPOSE 3001

# Jalankan aplikasi
CMD ["npm", "start"] 