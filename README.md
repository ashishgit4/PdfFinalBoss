# PdfFinalBoss 🛡️ (100% Free Cinematic PDF Lock & Unlock Utility)

**PdfFinalBoss** is a premium, cinematic web utility designed to unlock password-protected PDFs or encrypt standard PDFs with AES-256 secure locks. It runs fully client-side on the frontend with a supporting Node.js backend. 

Designed with modern cinematic aesthetics, custom glassmorphism overlays, smooth entrance animations, and a dynamic **Day/Night mode**, the application delivers a premium, distraction-free user experience with zero watermarks, zero limits, and no account registrations required.

---

## 🌟 Premium Features

### 1. Bypass & Apply Restrictions
* **Unlock PDF:** Instantly bypass owner-restricted credentials or open-passwords on files up to 100 MB.
* **Lock PDF:** Encrypt documents with AES-256 secure standard encryption. Features a live **Password Strength Indicator** and a secure **Random Password Generator**.

### 2. 🔑 Local Password Vault (Auto-Unlock)
* When locking a PDF, check the **"Remember this password in my vault"** option. 
* The password is encrypted and stored client-side inside your browser's local storage (`localStorage`), mapped to the document's unique PDF hash. 
* If you upload that exact same PDF again to unlock it, the website detects the hash and prompts you with **"Auto Unlock"** to immediately decrypt it, removing the need to remember or type the credentials. **Your passwords never leave your device.**

### 3. 🌓 Cinematic Day/Night Theme Toggling
* Click the Sun/Moon icon in the navigation bar to transition between themes.
* Features a smooth blend from a dark cinema layout to a light off-white layout while keeping the background video visible.

---

## 📂 Repository Architecture

The project is structured as a full-stack monorepo:

* `/frontend`: React + Vite + TypeScript single-page application. Styles are built with customized CSS variables inside `src/index.css`.
* `/backend`: Node.js + Express API handling multer-based PDF uploads, qpdf-powered encryption processes, and automatic cleanups.

---

## 🚀 Step-by-Step Local Setup Guide

Follow these steps to run **PdfFinalBoss** on your machine:

### 1. Pre-requisites
Make sure you have Node.js (version 16 or higher) installed on your system.

### 2. Set Up the Backend
1. Open your terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (runs on port 3000):
   ```bash
   npm start
   ```
   You will see the console log: `Server is running at http://localhost:3000`

### 3. Set Up the Frontend
1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server (runs on port 5173):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## ⚙️ Environment Variables & Deployment

The application is configured to build and deploy dynamically on host providers like **Vercel** (frontend) and **Render** (backend).

### Backend CORS Configuration
The Express server has CORS enabled globally (`app.use(cors())`), allowing your deployed Vercel URL to communicate with Render out-of-the-box.

### API Environment Configuration
The frontend automatically selects the backend server address inside [api.ts](file:///c:/Users/ashis/Music/projects/unlockpdf/frontend/src/services/api.ts):
```typescript
const API_URL = import.meta.env.VITE_API_URL || "https://pdffinalboss-1.onrender.com";
```
* **Local Development:** Vite reads `VITE_API_URL=http://localhost:3000` from the local [.env](file:///c:/Users/ashis/Music/projects/unlockpdf/frontend/.env) file.
* **Production Deployment:** If built on Vercel without environment variables, the system automatically falls back to your Render production URL: `https://pdffinalboss-1.onrender.com`.

---

## 🔒 Security & Privacy Policy

* **Secure In-Flight Decryption:** All transactions are protected via secure SSL/TLS connections during upload and download phases.
* **In-Memory Password Processing:** Passwords submitted to the backend reside in volatile memory only during the qpdf script execution. They are never written to disk, logged, or permanently stored.
* **Wipe Cache Policy:** All uploaded documents and processed outputs are permanently deleted from server disks automatically exactly 24 hours after upload.
