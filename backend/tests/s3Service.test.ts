/**
 * tests/s3Service.test.ts
 * Unit tests for s3Service functions — no real AWS calls.
 */
import {
  generateS3Key,
  validateFileMagicBytes,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../src/services/s3Service';
import { buildDummyPdf, buildDummyJpeg, buildDummyPng } from './helpers';

describe('generateS3Key', () => {
  it('T01 — produces medical-reports/<hash>/<uuid>.pdf for PDF', () => {
    const key = generateS3Key('patient123', 'application/pdf');
    expect(key).toMatch(/^medical-reports\/[a-f0-9]{16}\/[0-9a-f-]{36}\.pdf$/);
  });

  it('T02 — produces .jpg extension for image/jpeg', () => {
    const key = generateS3Key('patient123', 'image/jpeg');
    expect(key).toMatch(/\.jpg$/);
  });

  it('T03 — produces .png extension for image/png', () => {
    const key = generateS3Key('patient123', 'image/png');
    expect(key).toMatch(/\.png$/);
  });

  it('T04 — uses test/ prefix when specified', () => {
    const key = generateS3Key('patient123', 'application/pdf', 'test');
    expect(key).toMatch(/^test\//);
  });

  it('T05 — two calls produce different keys (UUID uniqueness)', () => {
    const k1 = generateS3Key('patient123', 'application/pdf');
    const k2 = generateS3Key('patient123', 'application/pdf');
    expect(k1).not.toBe(k2);
  });

  it('T06 — does not contain raw patientId (hashed)', () => {
    const patientId = 'mongodb-object-id-abc123';
    const key = generateS3Key(patientId, 'application/pdf');
    expect(key).not.toContain(patientId);
  });

  it('T07 — does not contain PII-like strings', () => {
    const key = generateS3Key('patient123', 'application/pdf');
    expect(key).not.toMatch(/name|email|diagnosis|condition/i);
  });
});

describe('ALLOWED_MIME_TYPES', () => {
  it('T08 — allows application/pdf', () => {
    expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
  });

  it('T09 — allows image/jpeg', () => {
    expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
  });

  it('T10 — allows image/png', () => {
    expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
  });

  it('T11 — rejects application/exe', () => {
    expect(ALLOWED_MIME_TYPES.has('application/exe')).toBe(false);
  });

  it('T12 — rejects text/html', () => {
    expect(ALLOWED_MIME_TYPES.has('text/html')).toBe(false);
  });

  it('T13 — rejects application/javascript', () => {
    expect(ALLOWED_MIME_TYPES.has('application/javascript')).toBe(false);
  });
});

describe('MAX_FILE_SIZE_BYTES', () => {
  it('T14 — is exactly 10 MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe('validateFileMagicBytes', () => {
  it('T15 — accepts valid PDF buffer', () => {
    expect(validateFileMagicBytes(buildDummyPdf(), 'application/pdf')).toBe(true);
  });

  it('T16 — accepts valid JPEG buffer', () => {
    expect(validateFileMagicBytes(buildDummyJpeg(), 'image/jpeg')).toBe(true);
  });

  it('T17 — accepts valid PNG buffer', () => {
    expect(validateFileMagicBytes(buildDummyPng(), 'image/png')).toBe(true);
  });

  it('T18 — rejects text buffer claiming to be PDF', () => {
    const fakePdf = Buffer.from('This is not a PDF file at all');
    expect(validateFileMagicBytes(fakePdf, 'application/pdf')).toBe(false);
  });

  it('T19 — rejects JPEG buffer claiming to be PNG', () => {
    expect(validateFileMagicBytes(buildDummyJpeg(), 'image/png')).toBe(false);
  });

  it('T20 — rejects empty buffer', () => {
    expect(validateFileMagicBytes(Buffer.alloc(0), 'application/pdf')).toBe(false);
  });

  it('T21 — rejects unknown MIME type', () => {
    expect(validateFileMagicBytes(buildDummyPdf(), 'application/unknown')).toBe(false);
  });
});
