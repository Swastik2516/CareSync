/**
 * tests/helpers.ts
 * Shared test utilities — in-memory MongoDB, JWT factory, dummy files, S3 mocks.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

// ── In-memory MongoDB ─────────────────────────────────────────────────────────
let mongod: MongoMemoryServer;

export async function connectTestDB() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

export async function disconnectTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

// ── JWT factory ───────────────────────────────────────────────────────────────
const TEST_JWT_SECRET = 'test-jwt-secret-phase2';
process.env.JWT_SECRET = TEST_JWT_SECRET;

export function makeToken(userId: string, role: 'PATIENT' | 'DOCTOR'): string {
  return jwt.sign({ userId, role }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

// ── Dummy PDF binary ──────────────────────────────────────────────────────────
export function buildDummyPdf(): Buffer {
  const body = [
    '%PDF-1.4',
    '1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj',
    '2 0 obj<</Type /Pages /Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type /Page /Parent 2 0 R /MediaBox[0 0 612 792]>>endobj',
    'xref\n0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    'trailer<</Size 4 /Root 1 0 R>>',
    'startxref\n190',
    '%%EOF',
  ].join('\n');
  return Buffer.from(body, 'utf8');
}

// ── Dummy JPEG binary (minimal valid JPEG) ────────────────────────────────────
export function buildDummyJpeg(): Buffer {
  // Minimal JPEG: SOI marker + EOI marker
  return Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0xFF, 0xD9]);
}

// ── Dummy PNG binary (minimal valid PNG) ─────────────────────────────────────
export function buildDummyPng(): Buffer {
  return Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
}

// ── Oversized buffer (11 MB) ──────────────────────────────────────────────────
export function buildOversizedBuffer(): Buffer {
  return Buffer.alloc(11 * 1024 * 1024, 0x41); // 11 MB of 'A'
}
