# PdfFinalBoss 🛡️ (100% Free & Private PDF Lock, Unlock & Vault Utility)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![React](https://img.shields.io/badge/Frontend-React_19_|_Vite_|_TypeScript-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_|_Express_|_qpdf-339933?logo=node.js)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel_|_Render-000000?logo=vercel)](https://vercel.com/)
[![GitHub Stars](https://img.shields.io/github/stars/ashishgit4/PdfFinalBoss?style=social)](https://github.com/ashishgit4/PdfFinalBoss)

**PdfFinalBoss** is a premium, cinematic web utility designed to unlock password-protected PDFs or encrypt documents with AES-256 secure locks. Built with zero ads, zero watermarks, no account requirements, and enterprise-grade privacy engineering.

🌐 **Live Application**: [https://pdf-final-boss.vercel.app](https://pdf-final-boss.vercel.app)  
💻 **GitHub Repository**: [https://github.com/ashishgit4/PdfFinalBoss](https://github.com/ashishgit4/PdfFinalBoss)  
☕ **Support & Ko-fi**: [https://ko-fi.com/ashishsharma11](https://ko-fi.com/ashishsharma11)

---

## 🌟 Key Features

### 1. 🔓 Bypass & Apply Restrictions
* **Unlock PDF:** Instantly remove owner-restricted credentials or open-passwords on PDF files up to **100 MB**. Automatically detects restricted PDFs and decrypts them in seconds.
* **Lock PDF:** Encrypt documents with **AES-256** military-grade standard encryption. Includes a live **Password Strength Indicator** and a 16-character **Random Password Generator**.

### 2. 🔑 Zero-Knowledge Local Password Vault (Auto-Unlock)
* When locking a PDF, check the **"Remember this password in my vault"** option.
* Passwords are encrypted and saved **client-side only** inside your browser's local storage (`localStorage`), mapped to the document's unique SHA-256 PDF hash.
* When you upload the exact same PDF again, the system recognizes the hash and prompts an **Auto-Unlock** action. **Your passwords never leave your device or get sent to any server.**

### 3. ⏳ 24-Hour Auto-Wipe Policy
* All uploaded documents and processed output files are automatically and permanently purged from server disks **24 hours** after upload by a background cleanup worker.
* Uploaded files are verified via binary magic bytes (`%PDF-`) to prevent non-document payload execution.

### 4. 🛡️ Hardened Security & Rate Limiting
* **qpdf CLI Argument Sanitization:** Hardened command execution using `--` argument delimiters to prevent argument injection attacks.
* **Header Injection Prevention:** All output filenames in `Content-Disposition` headers are sanitized to block HTTP Response Splitting.
* **Rate Limiting:** Guarded with `express-rate-limit` (100 API requests / 30 file uploads per 15-minute window per IP) and `helmet` security headers.

### 5. 🌓 Cinematic Day/Night Theme Engine
* Smooth transition between a starry dark cinema interface and a warm light off-white layout with dynamic background video scrims.

### 6. 💳 Integrated Dual Payment Hub
* International support via **Ko-fi** (PayPal, Apple Pay, Card).
* Domestic India support via **UPI QR Code** and **Razorpay** SDK integration.

---

## 📂 Repository Architecture

```
unlockpdf/
├── backend/
│   ├── bin/                    # qpdf 12.3.2 C++ PDF binary engine
│   ├── cryptoHelper.js          # AES-256-GCM, SHA-256 & PBKDF2 cryptographic helpers
│   ├── cryptoHelper.test.js     # Automated unit test suite
│   ├── server.js                # Express API server with security & rate limiters
│   ├── package.json
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/          # UI Components & ErrorBoundary
│   │   ├── pages/               # Home & BuyMeCoffeePage
│   │   ├── services/            # API Service layer
│   │   └── lib/                 # Payment SDK script loader
│   ├── index.html               # OpenGraph & SEO metadata
│   ├── package.json
│   └── .env.example             # Frontend environment template
├── package.json                 # Monorepo root scripts
├── vercel.json                  # SPA rewrite configuration
└── README.md
```

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite 8, TypeScript, Framer Motion, Tailwind CSS v4, Lucide React, Sonner Toasts.
* **Backend**: Node.js, Express, qpdf (Native C++ PDF Processing Engine), Multer, Helmet, Express-Rate-Limit, Razorpay SDK.
* **Security & Crypto**: Node.js Native Crypto (`aes-256-gcm`, `sha256`, `pbkdf2`), Binary Magic-Byte Verification.
* **Testing**: Node Test Runner (`node --test`).

---

## 🚀 Step-by-Step Local Setup Guide

### 1. Prerequisites
Make sure you have **Node.js (v18 or higher)** installed on your machine.

### 2. Monorepo Installation
From the root directory of the project, install dependencies for both frontend and backend:

```bash
npm run install:all
```

### 3. Environment Setup
Copy the environment template files in both directories:

```bash
# Backend .env
cp backend/.env.example backend/.env

# Frontend .env
cp frontend/.env.example frontend/.env
```

### 4. Run Development Servers
Start the backend Express server and frontend Vite development server:

* **Terminal 1 (Backend - Port 3000):**
  ```bash
  npm run start:backend
  ```

* **Terminal 2 (Frontend - Port 5173):**
  ```bash
  npm run dev:frontend
  ```

Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Automated Unit Tests

Run the backend cryptographic and hashing test suite:

```bash
npm test --prefix backend
```

---

## ⚙️ Environment Variables Reference

### Backend (`/backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `3000` | Port for the Express server. |
| `RAZORPAY_KEY_ID` | Optional | `rzp_test_placeholder` | Public key ID for Razorpay payments. |
| `RAZORPAY_KEY_SECRET` | Optional | `placeholder_secret` | Secret key for verifying Razorpay HMAC signatures. |
| `VAULT_SECRET` | Optional | Default 32-char key | Secret key for AES-256-GCM vault encryption. |

### Frontend (`/frontend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Optional | `http://localhost:3000` | Backend API URL (fallback: Render URL). |

---

## 🔒 Security & Privacy Blueprint

1. **In-Memory Password Processing:** Passwords submitted to the backend reside in volatile RAM only during qpdf execution and are never written to disk, logged, or recorded.
2. **Zero Server Retention Vault:** Local Password Vault items are encrypted client-side in browser `localStorage` and never transmitted over the network.
3. **24-Hour File Purge Policy:** Server disk cache is automatically purged by a 24-hour cleanup worker.
4. **CLI & Header Injection Protection:** qpdf commands use native array arguments with `--` delimiters, and download headers use sanitized filenames.

---

## 📄 License & Credits

This project is licensed under the **GPL-3.0 License**.

Developed with ❤️ by **[Ashish Sharma](https://github.com/ashishgit4)**.  
Support open-source development on **[Ko-fi](https://ko-fi.com/ashishsharma11)**!

