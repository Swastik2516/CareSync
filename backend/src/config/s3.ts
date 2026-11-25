import { S3Client } from '@aws-sdk/client-s3';

// ── Validate required AWS environment variables ───────────────────────────────
// Missing S3 config logs a warning but does NOT throw at module load time.
// This ensures unrelated features (auth, payments, appointments) keep working
// even if AWS vars are absent in a given environment.
const REQUIRED = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
] as const;

export type S3EnvKey = typeof REQUIRED[number];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(
    `[S3] WARNING: Missing environment variable(s): ${missing.join(', ')}. ` +
    'S3 medical file storage will be unavailable until these are set.'
  );
}

// ── S3 client singleton ───────────────────────────────────────────────────────
// Created once per process / Vercel serverless warm instance.
// Credentials are read exclusively from environment variables — never hardcoded.
let s3Instance: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Instance) {
    if (missing.length > 0) {
      throw new Error(
        `S3 client cannot be initialised. Missing: ${missing.join(', ')}`
      );
    }
    s3Instance = new S3Client({
      region: process.env.AWS_REGION as string,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID     as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return s3Instance;
};

// ── Bucket name helper ────────────────────────────────────────────────────────
export const getS3Bucket = (): string => {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET environment variable is not set.');
  }
  return process.env.AWS_S3_BUCKET;
};

// ── S3 availability check (used by service layer) ────────────────────────────
export const isS3Configured = (): boolean => missing.length === 0;
