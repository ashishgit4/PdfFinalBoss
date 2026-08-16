FROM node:20-bookworm

# Install qpdf and libreoffice for document conversion
RUN apt-get update && apt-get install -y qpdf libreoffice fontconfig fonts-dejavu && rm -rf /var/lib/apt/lists/*

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