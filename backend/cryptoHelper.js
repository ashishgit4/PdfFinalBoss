import crypto from 'crypto';
import fs from 'fs';

// Secret key used to encrypt the password vault. In production, load this from environment variables.
const VAULT_SECRET = process.env.VAULT_SECRET || 'pdf-final-boss-super-secret-key-32chars!'; // Must be 32 bytes

// 1. Generate SHA-256 hash of a file buffer
export function getFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// 1b. Asynchronously stream file hash to avoid event-loop blocking on large PDFs
export function getFileHashStream(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

// 2. Encrypt plaintext password for the vault (AES-256-GCM)
export function encryptPassword(plainText) {
  const iv = crypto.randomBytes(12); // GCM standard IV size
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(VAULT_SECRET.slice(0, 32)), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  // Return formatted as iv:tag:ciphertext
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

// 3. Decrypt ciphertext password from the vault (AES-256-GCM)
export function decryptPassword(vaultString) {
  const [ivHex, tagHex, cipherText] = vaultString.split(':');
  if (!ivHex || !tagHex || !cipherText) {
    throw new Error('Invalid vault entry format.');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(VAULT_SECRET.slice(0, 32)), iv);
  
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// 4. Hash user password for authentication (PBKDF2)
export function hashUserPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

// 5. Verify user password
export function verifyUserPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return verifyHash === hash;
}
