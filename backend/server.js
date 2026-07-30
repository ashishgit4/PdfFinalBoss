import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { decryptPDF } from '@pdfsmaller/pdf-decrypt';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup storage folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
} else {
  // Clear any leftover uploads on startup
  try {
    fs.readdirSync(uploadsDir).forEach(file => {
      fs.unlinkSync(path.join(uploadsDir, file));
    });
    console.log('Cleared uploads directory on startup.');
  } catch (err) {
    console.error('Failed to clean uploads directory on startup:', err);
  }
}

// In-memory Database to map IDs to temporary file paths
const filesDb = new Map(); // id -> { path, originalname, uploadTime, encrypted }

// Multer configurations for file upload limits (100MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB Limit
});

// Serve frontend build/files statically
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API 1: Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileId = uuidv4();
  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    // Check if the uploaded PDF file is password protected
    const buffer = fs.readFileSync(filePath);
    const isEncrypted = buffer.toString('binary').includes('/Encrypt');

    filesDb.set(fileId, {
      path: filePath,
      originalname: originalName,
      uploadTime: Date.now(),
      encrypted: isEncrypted
    });

    res.json({
      id: fileId,
      encrypted: isEncrypted
    });
  } catch (err) {
    console.error('Error processing uploaded file:', err);
    res.status(500).json({ error: 'Failed to parse file metrics.' });
  }
});

// API 2: Decrypt / Unlock endpoint
app.post('/api/unlock', async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ error: 'Missing document identity parameters or password key.' });
  }

  const fileMeta = filesDb.get(id);
  if (!fileMeta) {
    return res.status(404).json({ error: 'Document expired or not found. Please upload again.' });
  }

  try {
    const pdfBuffer = fs.readFileSync(fileMeta.path);
    // Perform pure Javascript decryption using @pdfsmaller/pdf-decrypt (WebCrypto base)
    const decryptedBytes = await decryptPDF(new Uint8Array(pdfBuffer), password);

    // Send binary PDF stream directly to browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalname.replace('.pdf', '')}_unlocked.pdf"`);
    res.send(Buffer.from(decryptedBytes));
  } catch (err) {
    console.error('PDF decryption error:', err);
    // If decryption fails, it indicates an invalid password
    res.status(401).json({ error: 'Incorrect password' });
  }
});

// Periodic Cache Cleanup: Delete uploads older than 60 minutes
setInterval(() => {
  const now = Date.now();
  const expiryDuration = 60 * 60 * 1000; // 60 minutes in ms

  for (const [id, meta] of filesDb.entries()) {
    if (now - meta.uploadTime > expiryDuration) {
      try {
        if (fs.existsSync(meta.path)) {
          fs.unlinkSync(meta.path);
        }
        filesDb.delete(id);
        console.log(`Auto-cleaned expired file ID: ${id}`);
      } catch (err) {
        console.error(`Failed to clean file ${meta.path}:`, err);
      }
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Launch integrated Express server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Serving frontend static files from: ${frontendPath}`);
});
