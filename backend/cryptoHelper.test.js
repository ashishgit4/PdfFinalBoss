import test from 'node:test';
import assert from 'node:assert/strict';
import { getFileHash, encryptPassword, decryptPassword, hashUserPassword, verifyUserPassword } from './cryptoHelper.js';

test('getFileHash returns valid SHA-256 hash', () => {
  const buffer = Buffer.from('test pdf content');
  const hash = getFileHash(buffer);
  assert.equal(typeof hash, 'string');
  assert.equal(hash.length, 64);
});

test('encryptPassword and decryptPassword round-trip successfully', () => {
  const secret = 'MySuperSecretPassword123!';
  const encrypted = encryptPassword(secret);
  assert.ok(encrypted.includes(':'));
  
  const decrypted = decryptPassword(encrypted);
  assert.equal(decrypted, secret);
});

test('hashUserPassword and verifyUserPassword authenticate correctly', () => {
  const pass = 'UserPassword999#';
  const hashed = hashUserPassword(pass);
  assert.ok(hashed.includes(':'));

  assert.equal(verifyUserPassword(pass, hashed), true);
  assert.equal(verifyUserPassword('WrongPassword', hashed), false);
});
