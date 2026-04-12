FROM node:20-slim

# Install build tools for native modules (better-sqlite3, @napi-rs/canvas)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY package*.json ./
COPY client/package*.json ./client/

# Install server deps — rebuild native modules for Linux
RUN npm install --build-from-source

# Install client deps
RUN cd client && npm install

# Copy source (node_modules excluded via .dockerignore)
COPY . .

# Build the React frontend
RUN cd client && npm run build

# Hugging Face Spaces requires port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server/index.js"]