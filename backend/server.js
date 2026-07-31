import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import { getFileHash, encryptPassword, decryptPassword, hashUserPassword, verifyUserPassword } from './cryptoHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execFilePromise = util.promisify(execFile);
const qpdfPath =
  process.platform === "win32"
    ? path.join(
        __dirname,
        "bin",
        "qpdf-12.3.2-msvc64",
        "bin",
        "qpdf.exe"
      )
    : "qpdf";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup storage folders
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Clear any leftover uploads on startup
try {
  fs.readdirSync(uploadsDir).forEach(file => {
    fs.unlinkSync(path.join(uploadsDir, file));
  });
  console.log('Cleared uploads directory on startup.');
} catch (err) {
  console.error('Error clearing uploads directory:', err);
}

const upload = multer({ dest: 'uploads/' });
const filesDb = new Map(); // fileId -> { path, originalname, uploadTime, encrypted, pdfHash }
// Local client-side local storage password vault system is active.
// All backend authentication routes and db sessions are removed for zero-barrier utility.

// ---------------------------------
// 3. CORE UPLOAD & PROCESSING ENDPOINTS
// ---------------------------------

// API 1: Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileId = uuidv4();
  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    // Read buffer and compute file hash
    const buffer = fs.readFileSync(filePath);
    const fileHash = getFileHash(buffer);

    let encrypted = false;
    let autoDecrypted = false;

    try {
      // Run show-encryption to check if file is encrypted and password requirements
      const { stdout } = await execFilePromise(qpdfPath, ['--show-encryption', filePath]);
      if (!stdout.includes('File is not encrypted')) {
        encrypted = true;
      }
    } catch (err) {
      const isEncrypted = err.code === 3 || err.message.includes('password') || err.message.includes('encrypted');
      if (isEncrypted) {
        encrypted = true;
      } else {
        throw err;
      }
    }

    let actuallyLocked = encrypted;

    if (encrypted) {
      const tempDecryptedPath = filePath + '.decrypted';
      try {
        // Try decrypting with empty password (works for restricted/owner-password-only PDFs)
        await execFilePromise(qpdfPath, ['--decrypt', filePath, tempDecryptedPath]);
        fs.renameSync(tempDecryptedPath, filePath);
        actuallyLocked = false;
        autoDecrypted = true;
        console.log(`Auto-unlocked restricted PDF (ID: ${fileId}) on upload.`);
      } catch (decryptErr) {
        actuallyLocked = true;
        if (fs.existsSync(tempDecryptedPath)) {
          try { fs.unlinkSync(tempDecryptedPath); } catch (e) {}
        }
      }
    }

    filesDb.set(fileId, {
      path: filePath,
      originalname: originalName,
      uploadTime: Date.now(),
      encrypted: actuallyLocked,
      pdfHash: fileHash
    });

    res.json({
      id: fileId,
      encrypted: actuallyLocked,
      autoDecrypted: autoDecrypted,
      pdfHash: fileHash
    });
  } catch (err) {
    console.error('Error processing uploaded file:', err);
    res.status(500).json({ error: 'Failed to parse file metrics.' });
  }
});

// API 2: Decrypt / Unlock endpoint
app.post('/api/unlock', async (req, res) => {
  const { id, password } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing document identity parameters.' });
  }

  const fileMeta = filesDb.get(id);
  if (!fileMeta) {
    return res.status(404).json({ error: 'Document expired or not found. Please upload again.' });
  }

  let decryptPass = password || '';

  const tempOutputPath = fileMeta.path + '.unlocked';

  try {
    let encrypted = false;
    try {
      const { stdout } = await execFilePromise(qpdfPath, ['--show-encryption', fileMeta.path]);
      if (!stdout.includes('File is not encrypted')) {
        encrypted = true;
      }
    } catch (err) {
      encrypted = true;
    }

    if (encrypted) {
      // Perform decryption with the provided password
      await execFilePromise(qpdfPath, [
        '--decrypt',
        `--password=${decryptPass}`,
        fileMeta.path,
        tempOutputPath
      ]);
    } else {
      // Just copy it directly
      fs.copyFileSync(fileMeta.path, tempOutputPath);
    }

    // Read the decrypted bytes to send back
    const decryptedBuffer = fs.readFileSync(tempOutputPath);
    
    // Clean up temporary output file
    try { fs.unlinkSync(tempOutputPath); } catch (e) {}

    // Send binary PDF stream directly to browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalname.replace('.pdf', '')}_unlocked.pdf"`);
    res.send(decryptedBuffer);
  } catch (err) {
    console.error('PDF decryption error:', err);
    if (fs.existsSync(tempOutputPath)) {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    }
    
    // If decryption fails, it indicates an invalid password
    res.status(401).json({ error: 'Incorrect password' });
  }
});

// API 3: Encrypt / Lock endpoint
app.post('/api/lock', async (req, res) => {
  const { id, password, saveToVault, hint, token } = req.body;
  if (!id || !password) {
    return res.status(400).json({ error: 'Missing document parameters or password.' });
  }

  const fileMeta = filesDb.get(id);
  if (!fileMeta) {
    return res.status(404).json({ error: 'Document expired or not found. Please upload again.' });
  }

  const tempOutputPath = fileMeta.path + '.locked';

  try {
    // Encrypt with qpdf using AES-256
    // Syntax: qpdf --encrypt user-password owner-password key-length --input-file output-file
    // We set user password to password, owner password to a random UUID to prevent easy removal, and key-length to 256.
    const randomOwnerPass = uuidv4();
    await execFilePromise(qpdfPath, [
      '--encrypt',
      password,
      randomOwnerPass,
      '256',
      '--',
      fileMeta.path,
      tempOutputPath
    ]);

    // Overwrite the original cached file with the encrypted version
    fs.copyFileSync(tempOutputPath, fileMeta.path);
    try { fs.unlinkSync(tempOutputPath); } catch (e) {}

    // Mark the file metadata as encrypted
    fileMeta.encrypted = true;
    filesDb.set(id, fileMeta);

    const lockedBuffer = fs.readFileSync(fileMeta.path);
    const lockedHash = getFileHash(lockedBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileMeta.originalname.replace('.pdf', '')}_locked.pdf"`);
    res.setHeader('Access-Control-Expose-Headers', 'X-PDF-Hash, X-PDF-Hint');
    res.setHeader('X-PDF-Hash', lockedHash);
    if (hint) {
      res.setHeader('X-PDF-Hint', encodeURIComponent(hint));
    }
    res.send(lockedBuffer);
  } catch (err) {
    console.error('Error locking PDF:', err);
    if (fs.existsSync(tempOutputPath)) {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to encrypt document.' });
  }
});

// Serve frontend build/files statically
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

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
