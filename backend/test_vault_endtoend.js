import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const BASE_URL = 'http://localhost:3000';
  
  // Simulated client-side localStorage vault
  const localVault = new Map();

  // Copy the valid qpdf-manual.pdf for testing
  const manualPdfPath = path.join(__dirname, 'bin', 'qpdf-12.3.2-msvc64', 'share', 'doc', 'qpdf', 'qpdf-manual.pdf');
  const testPdfPath = path.join(__dirname, 'dummy.pdf');
  fs.copyFileSync(manualPdfPath, testPdfPath);

  console.log('1. Uploading dummy PDF...');
  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(testPdfPath)], { type: 'application/pdf' }), 'dummy.pdf');
  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });
  const uploadData = await uploadRes.json();
  console.log('Upload Status:', uploadRes.status, uploadData);
  const fileId = uploadData.id;

  console.log('\n2. Locking PDF & Simulating Vault check...');
  const lockRes = await fetch(`${BASE_URL}/api/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: fileId,
      password: 'securePassword99!',
      saveToVault: true,
      hint: 'My super local password hint'
    })
  });
  console.log('Lock Status:', lockRes.status);
  
  // Extract custom headers returned by the server
  const lockedHash = lockRes.headers.get('X-PDF-Hash');
  const encodedHint = lockRes.headers.get('X-PDF-Hint');
  const hint = encodedHint ? decodeURIComponent(encodedHint) : '';
  console.log('Headers returned - Hash:', lockedHash, 'Hint:', hint);

  if (lockedHash) {
    // Save to our simulated client-side vault
    localVault.set(lockedHash, { password: 'securePassword99!', hint });
    console.log('Simulated client-side vault: saved password and hint.');
  }

  // Clean up original dummy.pdf
  try { fs.unlinkSync(testPdfPath); } catch (e) {}

  console.log('\n3. Re-uploading Locked PDF...');
  const lockedPdfBuffer = Buffer.from(await lockRes.arrayBuffer());
  const lockedPdfPath = path.join(__dirname, 'dummy_locked.pdf');
  fs.writeFileSync(lockedPdfPath, lockedPdfBuffer);

  const formData2 = new FormData();
  formData2.append('file', new Blob([fs.readFileSync(lockedPdfPath)], { type: 'application/pdf' }), 'dummy_locked.pdf');
  const uploadRes2 = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData2
  });
  const uploadData2 = await uploadRes2.json();
  console.log('Re-Upload Locked PDF Status:', uploadRes2.status, uploadData2);
  const reUploadedFileId = uploadData2.id;
  const reUploadedHash = uploadData2.pdfHash;

  console.log('\n4. Simulating client-side vault lookup...');
  const savedCredentials = localVault.get(reUploadedHash);
  if (savedCredentials) {
    console.log('Credentials found in client-side vault! Password:', savedCredentials.password, 'Hint:', savedCredentials.hint);
    
    console.log('\n5. Decrypting PDF by passing stored credentials...');
    const unlockRes = await fetch(`${BASE_URL}/api/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reUploadedFileId,
        password: savedCredentials.password
      })
    });
    console.log('Unlock Status:', unlockRes.status);
    const unlockedPdfBuffer = Buffer.from(await unlockRes.arrayBuffer());
    console.log('Unlocked PDF length:', unlockedPdfBuffer.length);

    // Clean up
    try { fs.unlinkSync(lockedPdfPath); } catch (e) {}
    
    if (unlockRes.status === 200 && unlockedPdfBuffer.length > 0) {
      console.log('\n🎉 SUCCESS: Local Storage Client Vault tested successfully end-to-end!');
    } else {
      console.log('\n❌ FAILURE: Client-side vault auto-unlock failed.');
    }
  } else {
    console.log('\n❌ FAILURE: Re-uploaded PDF hash did not match local vault key.');
    try { fs.unlinkSync(lockedPdfPath); } catch (e) {}
  }
}

run().catch(console.error);
