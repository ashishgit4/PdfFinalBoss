FROM node:20-bookworm

# Install qpdf
RUN apt-get update && apt-get install -y qpdf && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ .

EXPOSE 3000

CMD ["npm", "start"]