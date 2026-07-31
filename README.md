# PdfFinalBoss — 100% Free PDF Password Manager

**PdfFinalBoss** is a premium, cinematic SaaS landing page and utility for removing and applying PDF password protection. This project is structured as a full-stack monorepo:

- `frontend/`: Cinematic, responsive React + Vite + TypeScript single-page application.
- `backend/`: Node.js/Express server providing PDF encryption and decryption routines.

---

## ✨ Key Features

* **Unlock & Lock Modes:** Instantly remove owner restrictions and passwords or apply AES-256 secure encryption to any PDF.
* **🔒 Local Password Vault (Auto-Unlock):** 
  * If you encrypt a PDF and check **"Remember this password in my vault"**, the password is encrypted and stored safely inside your browser's `localStorage` mapped to the unique hash of the PDF.
  * If you ever upload that exact same PDF again to unlock it, the website detects the saved hash and prompts you with **"Auto Unlock"**, allowing you to unlock and decrypt the document instantly without needing to remember or type the password.
* **Cinematic Day/Night Mode:** Fully responsive cinematic background transitions with typography adjustments at a click of a button.

---

## 🚀 Quick Start Guide

To run **PdfFinalBoss** locally:

### 1. Start the Backend
Navigate to the `backend` folder, install packages, and start the node server:
```bash
cd backend
npm install
npm start
```
The server runs on `http://localhost:3000`.

### 2. Start the Frontend
Navigate to the `frontend` folder, install packages, and start the dev server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, TypeScript, Framer Motion, Tailored CSS variables, Inter display typography, responsive layout overlays.
- **Backend**: Node.js, Express, Multer, `qpdf` command-line utility.

---

## 🔒 Security & Privacy Policy

- **SSL Encryption**: Transferred bytes are protected in flight.
- **Temporary Cache**: Documents and temporary passwords reside in isolated memory/caches and are automatically deleted from server disks within 60 minutes.
- **Zero Logging**: Passwords are never saved, logged, or processed permanently on the server.
