import crypto from 'crypto';
import path from 'path';
import {
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost, PresignedPost } from '@aws-sdk/s3-presigned-post';
import { getS3Client, getS3Bucket } from '../config/s3';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRESIGN_EXPIRES_SECONDS = 300; // 5 minutes — applies to both POST and GET

// Phase 2 allowed MIME types for medical file uploads.
// DOC/DOCX removed: presigned POST content-type condition requires an exact
// match, and Word documents have inconsistent MIME types across browsers.
// They can be added back in a future phase with explicit browser-side mapping.
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

// Mapping from MIME type to canonical file extension (used in key generation).
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg':      '.jpg',
  'image/jpg':       '.jpg',
  'image/png':       '.png',
};

// Server-side enforced maximum upload size (10 MB).
// This is embedded in the S3 POST policy — S3 rejects any upload that
// exceeds this limit regardless of what the client declares.
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Minimum upload size (1 byte) — prevents zero-byte uploads.
const MIN_FILE_SIZE_BYTES = 1;

// ── File signature (magic bytes) validation ───────────────────────────────────
// Maps MIME type to the expected leading bytes of a valid file.
// Used in confirmUpload to reject files whose binary content does not match
// their declared MIME type (e.g. a .exe renamed to .pdf).
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[] }[]> = {
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],          // %PDF
  'image/jpeg':      [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],                 // JFIF/EXIF
  'image/jpg':       [{ offset: 0, bytes: [0xFF, 0xD8, 0xFF] }],
  'image/png':       [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }], // PNG
};

/**
 * Validates the magic bytes of a Buffer against the expected signature for
 * the given MIME type. Returns true if the bytes match, false otherwise.
 * This is a first-pass check — it does not replace a full AV/malware scan.
 */
export const validateFileMagicBytes = (
  buffer: Buffer,
  mimeType: string
): boolean => {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some(({ offset, bytes }) =>
    bytes.every((b, i) => buffer[offset + i] === b)
  );
};

// ── Key generation ────────────────────────────────────────────────────────────
/**
 * Generates a unique, opaque S3 object key.
 *
 * Format:  medical-reports/<hashedPatientId>/<uuid><ext>
 * Example: medical-reports/a3f9.../4c2e...-uuid.pdf
 *
 * Security rules:
 *  - patientId is SHA-256 hashed so the raw MongoDB ObjectId is not exposed
 *    in the S3 key (defence-in-depth against key enumeration).
 *  - No patient name, email, diagnosis or other PII in the key.
 *  - UUID guarantees uniqueness even for concurrent uploads.
 *  - Extension is derived from the validated MIME type, not the client filename.
 *  - A configurable prefix allows test uploads to be isolated (test/).
 */
export const generateS3Key = (
  patientId: string,
  mimeType: string,
  prefix = 'medical-reports'
): string => {
  const uuid          = crypto.randomUUID();
  const hashedPatient = crypto.createHash('sha256').update(patientId).digest('hex').slice(0, 16);
  const ext           = MIME_TO_EXT[mimeType] ?? '';
  return `${prefix}/${hashedPatient}/${uuid}${ext}`;
};

// ── Presigned POST (upload) ───────────────────────────────────────────────────
/**
 * Creates a short-lived presigned POST for direct browser-to-S3 uploads.
 *
 * Why POST instead of PUT:
 *  - POST policies support `content-length-range` which S3 enforces server-side.
 *    A presigned PUT URL has no server-side size enforcement — the client can
 *    upload any size regardless of what the backend declared.
 *  - POST policies also enforce the exact Content-Type and Key, preventing
 *    a client from substituting a different file type or path.
 *
 * The returned { url, fields } must be used together:
 *  - url   → the form action (S3 endpoint)
 *  - fields → form fields that must be included in the multipart POST body
 *             BEFORE the file field. S3 rejects the upload if any field is
 *             missing or modified.
 */
export const createS3PresignedPost = async (
  s3Key: string,
  mimeType: string,
  declaredFileSizeBytes: number
): Promise<PresignedPost> => {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `File type "${mimeType}" is not allowed. ` +
      `Accepted: ${[...ALLOWED_MIME_TYPES].join(', ')}`
    );
  }
  if (declaredFileSizeBytes < MIN_FILE_SIZE_BYTES) {
    throw new Error('File must not be empty.');
  }
  if (declaredFileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Declared file size exceeds the 10 MB limit.`);
  }

  return createPresignedPost(getS3Client(), {
    Bucket:  getS3Bucket(),
    Key:     s3Key,
    Expires: PRESIGN_EXPIRES_SECONDS,
    Conditions: [
      // S3 enforces this range — uploads outside it are rejected with HTTP 400.
      ['content-length-range', MIN_FILE_SIZE_BYTES, MAX_FILE_SIZE_BYTES],
      // Lock the Content-Type to exactly the declared MIME type.
      ['eq', '$Content-Type', mimeType],
      // Lock the key to exactly the server-generated key.
      ['eq', '$key', s3Key],
    ],
    Fields: {
      'Content-Type': mimeType,
    },
  });
};

// ── Presigned GET URL (download) ──────────────────────────────────────────────
/**
 * Returns a short-lived presigned GET URL for a private S3 object.
 * The bucket has Block All Public Access enabled — this is the only way
 * to read an object without AWS credentials.
 */
export const getPresignedDownloadUrl = async (s3Key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key:    s3Key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
};

// ── HeadObject metadata check ─────────────────────────────────────────────────
/**
 * Verifies an object exists in S3 and returns its metadata.
 * Used after a browser upload to confirm the file landed before saving MongoDB.
 * Returns null on 404 instead of throwing.
 */
export const getObjectMetadata = async (
  s3Key: string
): Promise<HeadObjectCommandOutput | null> => {
  try {
    const command = new HeadObjectCommand({ Bucket: getS3Bucket(), Key: s3Key });
    return await getS3Client().send(command);
  } catch (err: any) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
};

// ── Delete S3 object ───────────────────────────────────────────────────────────────
export const deleteS3Object = async (s3Key: string): Promise<void> => {
  const command = new DeleteObjectCommand({ Bucket: getS3Bucket(), Key: s3Key });
  await getS3Client().send(command);
};

// ── Legacy presigned PUT URL (kept for connectivity test script only) ─────────
// This function is used exclusively by scripts/testS3Connection.ts.
// All production upload flows use createS3PresignedPost instead.
export const getPresignedUploadUrl = async (
  s3Key: string,
  mimeType: string,
  fileSizeBytes: number
): Promise<string> => {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error(`File type "${mimeType}" is not allowed.`);
  }
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${fileSizeBytes} bytes exceeds the 10 MB limit.`);
  }
  const command = new PutObjectCommand({
    Bucket:      getS3Bucket(),
    Key:         s3Key,
    ContentType: mimeType,
    Metadata:    { 'uploaded-by': 'caresync-test-script' },
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: PRESIGN_EXPIRES_SECONDS });
};
