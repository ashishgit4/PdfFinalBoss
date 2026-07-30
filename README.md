# PdfFinalBoss — 100% Free PDF Password Unlocker

**PdfFinalBoss** is a premium, cinematic SaaS landing page and centralized toolkit utility for removing document restrictions and passwords. This project is structured as a two-tier repository:

- `frontend/`: Cinematic, responsive landing page and upload state wizard (`index.html`).
- `backend/`: Node.js/Express server providing uploads, encryption checks, and WebCrypto-powered decryption routines.

---

## 🚀 Quick Start Guide

To run **PdfFinalBoss** locally:

### 1. Install Backend Dependencies
Navigate to the `backend` folder and install required packages:
```bash
cd backend
npm install
```

### 2. Start the Server
Run the Express server:
```bash
npm start
```
The console will confirm:
`Server is running at http://localhost:3000`

### 3. Open in Browser
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🛠️ Technology Stack

- **Frontend**: Clean Vanilla JavaScript, custom HTML5 Canvas particle systems, CSS variables, Inter display typography, responsive layout overlays, and dynamic visual contrast elements.
- **Backend**: Node.js, Express, Multer (file streams handling), `@pdfsmaller/pdf-decrypt` (pure JavaScript decryption based on standard Web Crypto APIs).

---

## 🔒 Security & Privacy Policy

- **SSL Encryption**: Transferred bytes are protected in flight.
- **Temporary Cache**: Documents and temporary passwords reside in isolated memory/caches and are automatically deleted from server disks within 60 minutes.
- **Zero Logging**: Passwords are never saved, logged, or processed permanently.
