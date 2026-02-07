FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy server source code
COPY . .

# Expose port (matches process.env.PORT or default 3002)
EXPOSE 3002

# Start the server
CMD ["node", "index.js"]
