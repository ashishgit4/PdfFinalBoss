import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import util from 'util';
import fs from 'fs';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { marked } from 'marked';
import mammoth from 'mammoth';
import { getFileHash, getFileHashStream, encryptPassword, decryptPassword, hashUserPassword, verifyUserPassword } from './cryptoHelper.js';

// Load environment variables for local development
dotenv.config();

// Helper to sanitize filenames for HTTP headers to prevent CRLF injection
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

// Global exception and promise rejection handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

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

function getSofficePath() {
  if (process.platform === 'win32') {
    const commonPaths = [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
    ];
    for (const p of commonPaths) {
      if (fs.existsSync(p)) return p;
    }
    return 'soffice';
  }
  return 'soffice';
}

const sofficePath = getSofficePath();

// Conversion Helper for Images (JPG, JPEG, PNG)
async function convertImageToPDF(inputPath, outputPath, ext) {
  const pdfDoc = await PDFDocument.create();
  const imgBytes = fs.readFileSync(inputPath);
  let image;
  if (ext === '.png') {
    image = await pdfDoc.embedPng(imgBytes);
  } else {
    image = await pdfDoc.embedJpg(imgBytes);
  }
  
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

// Conversion Helper for Plain Text (.txt)
async function convertTextToPDF(inputPath, outputPath) {
  const text = fs.readFileSync(inputPath, 'utf-8');
  const pdfDoc = await PDFDocument.create();
  const pageMargin = 50;
  const fontSize = 12;
  const lineHeight = 16;
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const printableWidth = pageWidth - pageMargin * 2;

  const lines = text.split(/\r?\n/);
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin;

  for (let line of lines) {
    const maxCharsPerLine = Math.floor(printableWidth / 6.8);
    const subLines = line.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [''];

    for (let subLine of subLines) {
      if (currentY - lineHeight < pageMargin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - pageMargin;
      }
      currentPage.drawText(subLine, {
        x: pageMargin,
        y: currentY - fontSize,
        size: fontSize,
      });
      currentY -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

// Conversion Helper for Word (.docx) Server Fallback
async function convertDocxToPDFServer(inputPath, outputPath) {
  const result = await mammoth.convertToHtml({ path: inputPath });
  const htmlContent = result.value || '';

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageMargin = 50;
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const printableWidth = pageWidth - pageMargin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - pageMargin;

  // Convert HTML structure to formatted blocks preserving headings, lists, paragraphs
  const formattedBlocks = htmlContent
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# H1: $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n# H2: $1\n')
    .replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, '\n# H3: $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n# LI: $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n# P: $1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split(/\r?\n/);

  for (let line of formattedBlocks) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentY -= 6;
      continue;
    }

    let isH1 = trimmed.startsWith('# H1:');
    let isH2 = trimmed.startsWith('# H2:');
    let isH3 = trimmed.startsWith('# H3:');
    let isLI = trimmed.startsWith('# LI:');

    let textContent = trimmed
      .replace(/^# H1:\s*/, '')
      .replace(/^# H2:\s*/, '')
      .replace(/^# H3:\s*/, '')
      .replace(/^# LI:\s*/, '')
      .replace(/^# P:\s*/, '');

    if (!textContent) continue;

    let useFont = (isH1 || isH2 || isH3) ? boldFont : font;
    let fontSize = isH1 ? 18 : isH2 ? 15 : isH3 ? 13 : 10.5;
    let lineHeight = isH1 ? 24 : isH2 ? 20 : isH3 ? 17 : 15;
    let indent = isLI ? 15 : 0;

    if (isLI) {
      textContent = `•  ${textContent}`;
    }

    const maxCharsPerLine = Math.floor((printableWidth - indent) / (fontSize > 12 ? 7.2 : 6.2));
    const subLines = textContent.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [textContent];

    for (let subLine of subLines) {
      if (currentY - lineHeight < pageMargin) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - pageMargin;
      }
      try {
        currentPage.drawText(subLine, {
          x: pageMargin + indent,
          y: currentY - fontSize,
          size: fontSize,
          font: useFont,
          color: (isH1 || isH2) ? rgb(0.06, 0.09, 0.16) : rgb(0.12, 0.12, 0.12)
        });
      } catch (e) {
        currentPage.drawText(subLine.replace(/[^\x20-\x7E]/g, '?'), {
          x: pageMargin + indent,
          y: currentY - fontSize,
          size: fontSize,
          font: useFont,
          color: rgb(0.12, 0.12, 0.12)
        });
      }
      currentY -= lineHeight;
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

// Conversion Helper for Markdown (.md)
async function convertMarkdownToHTMLFile(inputPath) {
  const mdContent = fs.readFileSync(inputPath, 'utf-8');
  const htmlBody = await marked.parse(mdContent);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; }
    h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }
    code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 15px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f8f9fa; }
  </style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;
  const tempHtmlPath = inputPath + '.html';
  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');
  return tempHtmlPath;
}

const app = express();
const PORT = process.env.PORT || 3000;

// High-Performance Compression & Security Headers
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // Allows cross-origin static frontend assets
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
app.use(cors());
app.use(express.json());

// Rate Limiting Protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 API requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again in 15 minutes.' }
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 file uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Upload limit exceeded. Please wait a few minutes before trying again.' }
});

app.use('/api/', apiLimiter);

// Healthcheck & Pre-Warm endpoint to wake up cold-started cloud instances instantly
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

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

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // Strict 100MB file limit
});
const filesDb = new Map(); // fileId -> { path, originalname, uploadTime, encrypted, pdfHash }

// ---------------------------------
// 3. CORE UPLOAD & PROCESSING ENDPOINTS
// ---------------------------------

// API 1: Upload endpoint
app.post('/api/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileId = uuidv4();
  const filePath = req.file.path;
  const originalName = req.file.originalname;

  try {
    // Ultra-fast 5-byte header check (does not load 100MB into memory)
    const fd = fs.openSync(filePath, 'r');
    const headerBuf = Buffer.alloc(5);
    fs.readSync(fd, headerBuf, 0, 5, 0);
    fs.closeSync(fd);

    if (headerBuf.toString('utf-8') !== '%PDF-') {
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(400).json({ error: 'Invalid file content. Uploaded file is not a valid PDF document.' });
    }

    const fileHash = await getFileHashStream(filePath);

    let encrypted = false;
    let autoDecrypted = false;

    try {
      // Run show-encryption safely using CLI delimiter --
      const { stdout } = await execFilePromise(qpdfPath, ['--show-encryption', '--', filePath]);
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
        await execFilePromise(qpdfPath, ['--decrypt', '--password=', '--', filePath, tempDecryptedPath]);
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
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
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
    const encrypted = fileMeta.encrypted;

    if (encrypted) {
      // Perform decryption with provided password
      await execFilePromise(qpdfPath, [
        '--decrypt',
        '--password=' + decryptPass,
        '--',
        fileMeta.path,
        tempOutputPath
      ]);
    } else {
      // Copy directly
      fs.copyFileSync(fileMeta.path, tempOutputPath);
    }

    // Stream binary PDF directly to browser (0ms RAM buffer wait)
    const safeBaseName = sanitizeFilename(fileMeta.originalname.replace(/\.pdf$/i, ''));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}_unlocked.pdf"`);
    
    const readStream = fs.createReadStream(tempOutputPath);
    readStream.pipe(res);
    readStream.on('end', () => {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    });
    readStream.on('error', () => {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    });
  } catch (err) {
    console.error('PDF decryption error:', err);
    if (fs.existsSync(tempOutputPath)) {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    }
    
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

    const lockedHash = await getFileHashStream(fileMeta.path);

    const safeBaseName = sanitizeFilename(fileMeta.originalname.replace(/\.pdf$/i, ''));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}_locked.pdf"`);
    res.setHeader('Access-Control-Expose-Headers', 'X-PDF-Hash, X-PDF-Hint');
    res.setHeader('X-PDF-Hash', lockedHash);
    if (hint) {
      res.setHeader('X-PDF-Hint', encodeURIComponent(hint));
    }

    const readStream = fs.createReadStream(fileMeta.path);
    readStream.pipe(res);
  } catch (err) {
    console.error('Error locking PDF:', err);
    if (fs.existsSync(tempOutputPath)) {
      try { fs.unlinkSync(tempOutputPath); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to encrypt document.' });
  }
});

// API 3.5: Multi-Format Document to PDF Conversion
const ALLOWED_CONVERT_EXTENSIONS = [
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.jpg', '.jpeg', '.png', '.txt', '.csv', '.html', '.htm', '.md'
];

app.post('/api/convert', uploadLimiter, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const fileId = uuidv4();
  const rawInputPath = req.file.path;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase();

  if (!ALLOWED_CONVERT_EXTENSIONS.includes(ext)) {
    try { fs.unlinkSync(rawInputPath); } catch (e) {}
    return res.status(400).json({
      error: `Unsupported file format '${ext}'. Supported formats: Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx), Images (.jpg, .jpeg, .png), Text (.txt, .csv), Web (.html, .md)`
    });
  }

  // Rename raw upload file to include proper extension on disk so LibreOffice auto-detects filter format
  const inputFilePath = `${rawInputPath}${ext}`;
  try {
    fs.renameSync(rawInputPath, inputFilePath);
  } catch (renameErr) {
    // If rename fails, fallback to rawInputPath
  }

  const outputPdfPath = path.join(uploadsDir, `${fileId}.pdf`);

  try {
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
      await convertImageToPDF(inputFilePath, outputPdfPath, ext);
    } else if (ext === '.txt') {
      try {
        await convertTextToPDF(inputFilePath, outputPdfPath);
      } catch (txtErr) {
        await execFilePromise(sofficePath, ['--headless', '--convert-to', 'pdf', '--outdir', uploadsDir, '--', inputFilePath]);
        const baseNameNoExt = path.basename(inputFilePath, path.extname(inputFilePath));
        const generatedPdf = path.join(uploadsDir, `${baseNameNoExt}.pdf`);
        if (fs.existsSync(generatedPdf) && generatedPdf !== outputPdfPath) {
          fs.renameSync(generatedPdf, outputPdfPath);
        }
      }
    } else {
      let fileToConvertPath = inputFilePath;
      let cleanTempHtml = false;

      if (ext === '.md') {
        fileToConvertPath = await convertMarkdownToHTMLFile(inputFilePath);
        cleanTempHtml = true;
      }

      const absInputPath = path.resolve(fileToConvertPath);
      const absOutputDir = path.resolve(uploadsDir);
      const tempUserEnvDir = path.join('/tmp', `soffice_env_${fileId}`);

      const sofficeArgs = [
        '--headless',
        '--invisible',
        '--nocrashreport',
        '--nodefault',
        '--nofirststartwizard',
        '--norestore',
        `-env:UserInstallation=file://${tempUserEnvDir}`,
        '--convert-to', 'pdf',
        '--outdir', absOutputDir,
        absInputPath
      ];

      try {
        await execFilePromise(sofficePath, sofficeArgs, {
          cwd: absOutputDir,
          timeout: 45000,
          maxBuffer: 25 * 1024 * 1024
        });
        
        const baseNameNoExt = path.basename(absInputPath, path.extname(absInputPath));
        const generatedPdf = path.join(absOutputDir, `${baseNameNoExt}.pdf`);

        if (fs.existsSync(generatedPdf)) {
          if (generatedPdf !== outputPdfPath) {
            fs.renameSync(generatedPdf, outputPdfPath);
          }
        } else {
          if (!fs.existsSync(outputPdfPath)) {
            throw new Error('Converted PDF file was not generated.');
          }
        }
      } catch (execErr) {
        if (cleanTempHtml && fs.existsSync(fileToConvertPath)) {
          try { fs.unlinkSync(fileToConvertPath); } catch (e) {}
        }
        
        if (ext === '.docx' || ext === '.doc') {
          console.log('LibreOffice fallback for DOCX. Using mammoth JS conversion.');
          await convertDocxToPDFServer(inputFilePath, outputPdfPath);
        } else {
          console.error('LibreOffice conversion failed:', execErr.message || execErr);
          throw new Error('Document conversion failed. Unable to render format.');
        }
      } finally {
        if (fs.existsSync(tempUserEnvDir)) {
          try { fs.rmSync(tempUserEnvDir, { recursive: true, force: true }); } catch (e) {}
        }
      }

      if (cleanTempHtml && fs.existsSync(fileToConvertPath)) {
        try { fs.unlinkSync(fileToConvertPath); } catch (e) {}
      }
    }

    // Clean up input files
    if (fs.existsSync(inputFilePath)) {
      try { fs.unlinkSync(inputFilePath); } catch (e) {}
    }
    if (fs.existsSync(rawInputPath)) {
      try { fs.unlinkSync(rawInputPath); } catch (e) {}
    }

    const fileHash = await getFileHashStream(outputPdfPath);
    const convertedName = originalName.substring(0, originalName.lastIndexOf('.')) + '.pdf';

    filesDb.set(fileId, {
      path: outputPdfPath,
      originalname: convertedName,
      uploadTime: Date.now(),
      encrypted: false,
      pdfHash: fileHash
    });

    res.json({
      id: fileId,
      originalname: convertedName,
      message: 'File converted to PDF successfully.',
      pdfHash: fileHash
    });
  } catch (err) {
    console.error('Error converting file to PDF:', err);
    if (fs.existsSync(inputFilePath)) {
      try { fs.unlinkSync(inputFilePath); } catch (e) {}
    }
    if (fs.existsSync(rawInputPath)) {
      try { fs.unlinkSync(rawInputPath); } catch (e) {}
    }
    if (fs.existsSync(outputPdfPath)) {
      try { fs.unlinkSync(outputPdfPath); } catch (e) {}
    }
    res.status(500).json({ error: err.message || 'Failed to convert file to PDF.' });
  }
});

// API 3.6: Download Converted PDF endpoint
app.post('/api/download-converted', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Missing document identity parameters.' });
  }

  const fileMeta = filesDb.get(id);
  if (!fileMeta || !fs.existsSync(fileMeta.path)) {
    return res.status(404).json({ error: 'Document expired or not found. Please upload again.' });
  }

  const safeBaseName = sanitizeFilename(fileMeta.originalname);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeBaseName}"`);

  const readStream = fs.createReadStream(fileMeta.path);
  readStream.pipe(res);
});

// ---------------------------------
// 4. RAZORPAY PAYMENT ENDPOINTS
// ---------------------------------

// API 4: Create Razorpay Order
app.post('/api/payments/order', async (req, res) => {
  const { amount, currency } = req.body;

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0 || numericAmount > 50000) {
    return res.status(400).json({ error: 'Valid payment amount is required (₹1 - ₹50,000).' });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials missing from server environment.');
    return res.status(500).json({ error: 'Payment gateway configuration error' });
  }

  const options = {
    amount: Math.round(numericAmount * 100), // Amount in paise
    currency: currency || 'INR',
    receipt: `receipt_${uuidv4().substring(0, 8)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// API 5: Verify Razorpay Payment Signature
app.post('/api/payments/verify', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing verification parameters' });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'Payment gateway configuration error' });
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (isSignatureValid) {
    res.json({ success: true, message: 'Payment verified successfully' });
  } else {
    console.warn('Razorpay signature mismatch:', { expectedSignature, razorpay_signature });
    res.status(400).json({ success: false, error: 'Signature verification failed' });
  }
});

// Serve frontend build/files statically
const distPath = path.join(__dirname, '../frontend/dist');
const rawPath = path.join(__dirname, '../frontend');
const frontendPath = fs.existsSync(distPath) ? distPath : rawPath;
app.use(express.static(frontendPath, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Periodic Cache Cleanup: Delete uploads older than 24 hours (1 day)
setInterval(() => {
  const now = Date.now();
  const expiryDuration = 24 * 60 * 60 * 1000; // 24 hours in ms

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
}, 15 * 60 * 1000); // Check every 15 minutes

// Global error handling middleware for Express routes
app.use((err, req, res, next) => {
  console.error('Unhandled Route Error:', err.stack || err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Launch integrated Express server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Serving frontend static files from: ${frontendPath}`);
});
