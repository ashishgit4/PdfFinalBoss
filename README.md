# PdfFinalBoss 🛡️

PdfFinalBoss is a web app for unlocking and locking PDFs and converting common document formats to PDF. It has a React and Vite frontend and an Express API that uses qpdf for PDF encryption operations.

- **Live application:** [pdf-final-boss.vercel.app](https://pdf-final-boss.vercel.app)
- **Source repository:** [github.com/ashishgit4/PdfFinalBoss](https://github.com/ashishgit4/PdfFinalBoss)
- **Support:** [Ko-fi](https://ko-fi.com/ashishsharma11)

The interface includes day and night themes, password strength feedback, a random password generator, and a support page with Ko-fi and UPI options.

## What it can do

- Unlock password-protected PDFs when you provide the correct password, and remove restrictions from PDFs that do not require an open password.
- Add password protection to PDFs.
- Convert Word, Excel, PowerPoint, image, text, CSV, HTML, and Markdown files to PDF.
- Optionally remember a PDF password in browser storage, indexed by a SHA-256 hash of the PDF, to offer it again for the same file.
- Offer Ko-fi and UPI support options.

The server accepts files up to 100 MB. Uploaded and generated files are stored under `backend/uploads` while processing and are removed after 24 hours; files left from a previous server run are cleared when the backend starts.

> **Password vault detail:** The current frontend stores the opted-in password as plain text in the browser's `localStorage`. It is not encrypted by the backend crypto helpers. Anyone with access to that browser profile or its developer tools may be able to read it. Do not use the vault on a shared or untrusted device.

## Using the app

1. Open the application and choose **Unlock**, **Lock**, or **Convert**.
2. Select or drop a file. PDFs are required for lock and unlock; conversion accepts the listed document formats. The maximum file size is 100 MB.
3. For an encrypted PDF, enter its password to unlock it. To lock a PDF, choose a password and optionally add a hint, then download the resulting file.
4. To convert a document, upload it in Convert mode and download the generated PDF when processing finishes.
5. The optional password vault can offer a saved password again when the same PDF is uploaded. See the vault security note above before enabling it.

## Project layout

```text
unlockpdf/
├── backend/
│   ├── bin/                 # Bundled qpdf binary for Windows
│   ├── cryptoHelper.js      # SHA-256, AES-256-GCM and PBKDF2 helper functions
│   ├── cryptoHelper.test.js # Backend unit tests
│   ├── server.js            # Express API and conversion logic
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React UI
│   │   ├── pages/           # Home and support pages
│   │   └── services/        # API and document conversion code
│   ├── .env.example
│   └── package.json
├── Dockerfile
├── package.json             # Convenience scripts
└── vercel.json              # Vercel frontend configuration
```

## Requirements

- Node.js 20 or later and npm. The Docker image uses Node 20; use that version for local development.
- qpdf on Linux/macOS, available on `PATH`. On Windows, the backend uses the qpdf binary included in `backend/bin`.
- LibreOffice on the backend host for server-side conversion of Office and other supported formats. The Dockerfile installs LibreOffice. DOCX may use a remote Gotenberg-compatible converter as a fallback.

## Technology stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Framer Motion, Lucide React, and Sonner.
- **Backend:** Node.js, Express, Multer, qpdf, LibreOffice, Helmet, CORS, and express-rate-limit.
- **PDF and document handling:** qpdf and pdf-lib on the backend; Mammoth, JSZip, html2pdf.js, and pdf-lib in browser-side conversion code.
- **Project support:** Ko-fi and UPI links.
- **Tests and quality tools:** Node.js test runner, TypeScript, ESLint, and Prettier.

## Local development

Run commands from the repository root unless a command says otherwise.

1. Install frontend and backend dependencies:

   ```bash
   npm ci --prefix frontend
   npm ci --prefix backend
   ```

2. Create local environment files from the examples.

   macOS/Linux:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   PowerShell:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

3. Start the API in one terminal:

   ```bash
   npm run dev --prefix backend
   ```

   The API listens on `http://localhost:3000` by default. Confirm it is running at `http://localhost:3000/api/health`.

4. Start the web app in another terminal:

   ```bash
   npm run dev --prefix frontend
   ```

   Open the local URL printed by Vite, usually `http://localhost:5173`. Vite proxies `/api` requests to the local backend.

To run the production frontend build locally:

```bash
npm run build --prefix frontend
npm run preview --prefix frontend
```

## Environment variables

All variables are optional for basic local development. Copy the example files, then set only the values you need.

### Backend (`backend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Port used by the Express API. |
| `GOTENBERG_URL` | Unset | Base URL of a Gotenberg-compatible service used as a DOCX conversion fallback when local LibreOffice conversion fails. `DOCX_CONVERTER_API_URL` is also accepted. |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Production API fallback | Base URL for the backend API. Set to `http://localhost:3000` for local development. Vite's dev proxy is used for `/api` requests. |

Vite variables are included in browser code. Never put secrets in `frontend/.env` or in a `VITE_*` variable.

## Useful commands

Run these from the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev --prefix frontend` | Start the Vite development server. |
| `npm run dev --prefix backend` | Start the API with nodemon. |
| `npm start --prefix backend` | Start the API without nodemon. |
| `npm run build --prefix frontend` | Type-check and build the frontend. |
| `npm run lint --prefix frontend` | Run ESLint on the frontend. |
| `npm run typecheck --prefix frontend` | Run the frontend TypeScript check. |
| `npm test --prefix backend` | Run backend tests with Node's test runner. |

## API overview

The backend exposes these main routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check. |
| `POST` | `/api/upload` | Upload a PDF for unlock/lock workflows. |
| `POST` | `/api/unlock` | Unlock an uploaded PDF. |
| `POST` | `/api/lock` | Encrypt an uploaded PDF. |
| `POST` | `/api/convert` | Convert a supported document to PDF. |
| `POST` | `/api/download-converted` | Download a converted PDF. |

Uploads and conversion requests are limited to 30 per IP per 15 minutes; API requests are limited to 100 per IP per 15 minutes. The API currently enables CORS for browser clients.

The browser sends PDF lock/unlock operations and backend conversions to the API. DOCX and PPTX also have frontend conversion code; conversion output and fidelity can differ by file and conversion path. The backend helper module contains AES-256-GCM password encryption and PBKDF2 hashing functions, but the current frontend vault does not use those helpers.

## Conversion formats and system tools

The conversion endpoint accepts `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.jpg`, `.jpeg`, `.png`, `.txt`, `.csv`, `.html`, `.htm`, and `.md` files. Office, CSV, HTML, and Markdown conversion uses LibreOffice on the backend. Images and plain text also have built-in converters. Conversion fidelity depends on the source document and installed fonts.

The repository includes a Dockerfile that installs qpdf and LibreOffice on Debian. The backend package also references the repository root as a local npm package (`file:..`), so a container build must include the root `package.json` in the image before running `npm install`. Review the Dockerfile and build context before using it for deployment. For persistent upload storage, mount a volume at `/app/backend/uploads`; note that backend startup clears files already in that directory.

## Deployment notes

- The root `vercel.json` configures a Vite frontend build and SPA fallback. Set `VITE_API_URL` in the frontend deployment environment to the publicly reachable backend URL.
- Deploy the backend separately on a host that can run the Dockerfile or install Node.js, qpdf, and LibreOffice. Configure `PORT` if the platform requires it.
- If using the DOCX fallback, set `GOTENBERG_URL` on the backend. Documents sent to this service leave the backend host, so configure a service you trust.

## Development workflow

1. Create a branch for your change.
2. Install dependencies and configure the relevant environment file(s).
3. Start the backend and frontend, then make and review your change in the browser.
4. Before opening a pull request, run the relevant checks:

   ```bash
   npm run build --prefix frontend
   npm run lint --prefix frontend
   npm test --prefix backend
   ```

5. Include a short summary, screenshots for visible UI changes, and any configuration or deployment notes in the pull request.

## Troubleshooting

- **Frontend cannot reach the API:** Make sure the backend is running on port 3000. Check `VITE_API_URL` if you are not using Vite's local proxy.
- **PDF operations fail on Linux/macOS:** Install qpdf and ensure `qpdf` is on `PATH`.
- **Office conversion fails:** Install LibreOffice and ensure `soffice` is on `PATH`. For DOCX, configure `GOTENBERG_URL` if local LibreOffice is unavailable.
- **Upload is rejected:** Confirm the PDF is a valid PDF, or that the conversion file extension is supported, and that the file is below 100 MB.
- **API reports the file expired:** Uploads are temporary and are removed after 24 hours or when the backend restarts.

## License

This project is licensed under the GNU General Public License v3.0. See the [GPL-3.0 license text](https://www.gnu.org/licenses/gpl-3.0.html).

Developed by [Ashish Sharma](https://github.com/ashishgit4). Support the project on [Ko-fi](https://ko-fi.com/ashishsharma11).
