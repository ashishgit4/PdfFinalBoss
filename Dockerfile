FROM node:20-bookworm

# Install document conversion tools and fonts used by LibreOffice.
RUN apt-get update && apt-get install -y --no-install-recommends \
    qpdf \
    fontconfig \
    fonts-liberation \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    fonts-noto-core \
    fonts-noto-color-emoji \
    fonts-dejavu \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

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