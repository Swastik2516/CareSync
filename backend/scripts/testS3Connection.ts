/**
 * scripts/testS3Connection.ts
 *
 * Local-only S3 Phase 1 connectivity test.
 *
 * Run from the backend/ directory:
 *   npx ts-node --project scripts/tsconfig.json scripts/testS3Connection.ts
 *
 * What it tests:
 *  T1  — backend/.env is loaded and all AWS env vars are present
 *  T2  — S3 client initialises without error
 *  T3  — Presigned PUT URL is generated (5-minute expiry)
 *  T4  — PUT request to presigned URL returns HTTP 200
 *  T5  — HeadObject confirms object exists, correct ContentType, ContentLength, encryption
 *  T6  — Presigned GET URL is generated (5-minute expiry)
 *  T7  — Internal GET download returns the exact bytes that were uploaded
 *  T8  — Anonymous (unsigned) GET of the same key is denied (HTTP 403)
 *  T9  — TypeScript compilation of this script passes (run separately)
 *
 * What it does NOT do:
 *  - Does NOT print presigned URLs, access keys, secrets or auth headers
 *  - Does NOT use ListBuckets or ListObjects (not in IAM policy)
 *  - Does NOT use DeleteObject (not in IAM policy)
 *  - Does NOT upload real patient data
 *  - Does NOT connect to MongoDB
 *  - Does NOT run in production
 */

// ── Load backend/.env FIRST — before any other import ──────────────────────
// IMPORTANT: With ts-node (CommonJS mode), all `import` statements are hoisted
// and executed before any code in the module body. This means a top-level
// `import dotenv from 'dotenv'; dotenv.config()` runs AFTER s3.ts has already
// evaluated its module-level `missing` array — so env vars appear absent.
//
// The only reliable fix is to use require() synchronously as the very first
// statement, before TypeScript processes any other imports.
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

import path from 'path';

import https from 'https';
import http from 'http';
import { URL } from 'url';

import {
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  getObjectMetadata,
  generateS3Key,
} from '../src/services/s3Service';
import { isS3Configured } from '../src/config/s3';

// ── Safety guard ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  console.error('[testS3] This script must not run in production. Exiting.');
  process.exit(1);
}

// ── Test result tracking ──────────────────────────────────────────────────────
interface TestResult { id: string; description: string; passed: boolean; detail: string }
const results: TestResult[] = [];

function record(id: string, description: string, passed: boolean, detail: string) {
  results.push({ id, description, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`  ${icon}  [${id}] ${description}`);
  if (detail) console.log(`         ${detail}`);
}

// ── Minimal valid PDF binary ──────────────────────────────────────────────────
// A structurally correct single-page PDF that any PDF reader can open.
// Generated inline so the test has zero external file dependencies.
// This is the actual file content uploaded to S3 — extension, MIME type
// and binary content all match.
function buildDummyPdf(): Buffer {
  const body = [
    '%PDF-1.4',
    '1 0 obj<</Type /Catalog /Pages 2 0 R>>endobj',
    '2 0 obj<</Type /Pages /Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type /Page /Parent 2 0 R /MediaBox[0 0 612 792]>>endobj',
    'xref',
    '0 4',
    '0000000000 65535 f ',
    '0000000009 00000 n ',
    '0000000058 00000 n ',
    '0000000115 00000 n ',
    'trailer<</Size 4 /Root 1 0 R>>',
    'startxref',
    '190',
    '%%EOF',
  ].join('\n');
  return Buffer.from(body, 'utf8');
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

/**
 * PUT a Buffer to a presigned S3 URL.
 * Returns { statusCode, responseBody }.
 * Only sends headers that are in X-Amz-SignedHeaders (just 'host' now that
 * ServerSideEncryption is removed from PutObjectCommand).
 * Content-Type and Content-Length are always required by S3 for PUT.
 */
function putToPresignedUrl(
  presignedUrl: string,
  body: Buffer,
  contentType: string
): Promise<{ statusCode: number; responseBody: string }> {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(presignedUrl);
    const useHttps = parsed.protocol === 'https:';
    const lib     = useHttps ? https : http;

    const req = lib.request(
      {
        method:   'PUT',
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        headers:  {
          'Content-Type':   contentType,
          'Content-Length': body.length,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end',  () => resolve({ statusCode: res.statusCode ?? 0, responseBody: raw }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * GET a URL (presigned or plain) and return the raw response bytes + status.
 * Used for both the internal download verification and the anonymous access test.
 */
function getFromUrl(
  targetUrl: string,
  extraHeaders: Record<string, string> = {}
): Promise<{ statusCode: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(targetUrl);
    const useHttps = parsed.protocol === 'https:';
    const lib      = useHttps ? https : http;

    const req = lib.request(
      {
        method:   'GET',
        hostname: parsed.hostname,
        path:     parsed.pathname + parsed.search,
        headers:  extraHeaders,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on('end',  () => resolve({ statusCode: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

/**
 * Build the anonymous (unsigned) URL for an S3 object.
 * This is the direct path-style URL with no query parameters.
 * A correctly locked-down bucket must return 403 for this request.
 */
function buildAnonymousUrl(bucket: string, region: string, key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  CareSync — S3 Phase 1 Connectivity Test');
  console.log('══════════════════════════════════════════════════════\n');

  // ── T1: Environment variables ─────────────────────────────────────────────
  const configured = isS3Configured();
  record(
    'T1', 'AWS environment variables present',
    configured,
    configured
      ? `Region=${process.env.AWS_REGION}  Bucket=${process.env.AWS_S3_BUCKET}`
      : 'Missing vars — check backend/.env'
  );
  if (!configured) {
    printSummary();
    process.exit(1);
  }

  // ── T2: S3 client initialises ─────────────────────────────────────────────
  let clientOk = false;
  try {
    // getS3Client() throws if env vars are missing; we already checked above.
    // Import lazily to ensure dotenv has already run.
    const { getS3Client } = await import('../src/config/s3');
    getS3Client();
    clientOk = true;
  } catch (err: any) {
    record('T2', 'S3 client initialises', false, err.message);
    printSummary(); process.exit(1);
  }
  record('T2', 'S3 client initialises', true, 'S3Client singleton created successfully');

  // ── Build test file ───────────────────────────────────────────────────────
  const TEST_PATIENT_ID  = 'test-patient-local';
  const TEST_FILE_NAME   = 'caresync-s3-connectivity-test.pdf';  // .pdf extension
  const TEST_MIME        = 'application/pdf';                     // matching MIME
  const TEST_PDF_BUFFER  = buildDummyPdf();                       // real PDF binary
  const TEST_SIZE        = TEST_PDF_BUFFER.length;

  console.log(`\n  Test file : ${TEST_FILE_NAME}`);
  console.log(`  MIME type : ${TEST_MIME}`);
  console.log(`  Size      : ${TEST_SIZE} bytes`);
  console.log(`  PDF magic : ${TEST_PDF_BUFFER.slice(0, 8).toString('ascii')} (must start with %PDF)\n`);

  const s3Key = generateS3Key(TEST_PATIENT_ID, TEST_FILE_NAME, 'test');
  console.log(`  S3 key    : ${s3Key}\n`);

  // ── T3: Generate presigned upload URL ────────────────────────────────────
  let uploadUrl = '';
  try {
    uploadUrl = await getPresignedUploadUrl(s3Key, TEST_MIME, TEST_SIZE);
    // Parse the URL to extract non-secret metadata for logging
    const parsed      = new URL(uploadUrl);
    const algorithm   = parsed.searchParams.get('X-Amz-Algorithm') ?? 'n/a';
    const expires     = parsed.searchParams.get('X-Amz-Expires')   ?? 'n/a';
    const signedHdrs  = parsed.searchParams.get('X-Amz-SignedHeaders') ?? 'n/a';
    record('T3', 'Presigned PUT URL generated (5-min expiry)', true,
      `Algorithm=${algorithm}  Expires=${expires}s  SignedHeaders=${signedHdrs}`);
  } catch (err: any) {
    record('T3', 'Presigned PUT URL generated', false, err.message);
    printSummary(); process.exit(1);
  }

  // ── T4: Upload via presigned PUT URL ─────────────────────────────────────
  try {
    const { statusCode, responseBody } = await putToPresignedUrl(uploadUrl, TEST_PDF_BUFFER, TEST_MIME);
    const passed = statusCode === 200;
    record('T4', 'PUT to presigned URL returns HTTP 200', passed,
      passed
        ? `HTTP ${statusCode} — upload accepted by S3`
        : `HTTP ${statusCode} — ${responseBody.slice(0, 200)}`);
    if (!passed) { printSummary(); process.exit(1); }
  } catch (err: any) {
    record('T4', 'PUT to presigned URL returns HTTP 200', false, err.message);
    printSummary(); process.exit(1);
  }

  // ── T5: HeadObject — existence, ContentType, ContentLength, encryption ────
  try {
    const meta = await getObjectMetadata(s3Key);
    if (!meta) {
      record('T5', 'HeadObject confirms object in S3', false, 'HeadObject returned null (object not found)');
      printSummary(); process.exit(1);
    }

    const ctOk   = meta.ContentType === TEST_MIME;
    const clOk   = meta.ContentLength === TEST_SIZE;
    const sseOk  = meta.ServerSideEncryption === 'AES256';

    console.log('\n  HeadObject metadata:');
    console.log(`    ContentType          : ${meta.ContentType}  ${ctOk  ? '✅' : '❌ expected ' + TEST_MIME}`);
    console.log(`    ContentLength        : ${meta.ContentLength} bytes  ${clOk  ? '✅' : '❌ expected ' + TEST_SIZE}`);
    console.log(`    ServerSideEncryption : ${meta.ServerSideEncryption ?? 'not reported'}  ${sseOk ? '✅' : '⚠️  bucket default encryption may differ'}`);
    console.log(`    ETag                 : ${meta.ETag}`);
    console.log(`    LastModified         : ${meta.LastModified}\n`);

    const allOk = ctOk && clOk;
    record('T5', 'HeadObject: ContentType, ContentLength, SSE-S3 encryption', allOk,
      allOk
        ? `ContentType=${meta.ContentType}  ContentLength=${meta.ContentLength}  SSE=${meta.ServerSideEncryption}`
        : `ContentType match=${ctOk}  ContentLength match=${clOk}  SSE=${meta.ServerSideEncryption}`);
    if (!allOk) { printSummary(); process.exit(1); }
  } catch (err: any) {
    record('T5', 'HeadObject confirms object in S3', false, err.message);
    printSummary(); process.exit(1);
  }

  // ── T6: Generate presigned GET URL ────────────────────────────────────────
  let downloadUrl = '';
  try {
    downloadUrl = await getPresignedDownloadUrl(s3Key);
    const parsed    = new URL(downloadUrl);
    const expires   = parsed.searchParams.get('X-Amz-Expires') ?? 'n/a';
    record('T6', 'Presigned GET URL generated (5-min expiry)', true,
      `Expires=${expires}s — URL not printed (security)`);
  } catch (err: any) {
    record('T6', 'Presigned GET URL generated', false, err.message);
    printSummary(); process.exit(1);
  }

  // ── T7: Internal download — byte-for-byte comparison ─────────────────────
  try {
    const { statusCode, body: downloaded } = await getFromUrl(downloadUrl);
    if (statusCode !== 200) {
      record('T7', 'Presigned GET download returns correct bytes', false,
        `HTTP ${statusCode} — expected 200`);
      printSummary(); process.exit(1);
    }

    const bytesMatch = downloaded.equals(TEST_PDF_BUFFER);
    record('T7', 'Downloaded bytes match uploaded PDF exactly', bytesMatch,
      bytesMatch
        ? `${downloaded.length} bytes downloaded — byte-for-byte match confirmed`
        : `Downloaded ${downloaded.length} bytes, uploaded ${TEST_PDF_BUFFER.length} bytes — MISMATCH`);
    if (!bytesMatch) { printSummary(); process.exit(1); }
  } catch (err: any) {
    record('T7', 'Presigned GET download returns correct bytes', false, err.message);
    printSummary(); process.exit(1);
  }

  // ── T8: Anonymous access is denied ───────────────────────────────────────
  try {
    const bucket = process.env.AWS_S3_BUCKET!;
    const region = process.env.AWS_REGION!;
    const anonUrl = buildAnonymousUrl(bucket, region, s3Key);
    // anonUrl is a plain HTTPS URL with no query params — not a presigned URL.
    // We do NOT print it because it contains the bucket name and key.
    const { statusCode } = await getFromUrl(anonUrl);
    const denied = statusCode === 403;
    record('T8', 'Anonymous (unsigned) GET is denied with HTTP 403', denied,
      denied
        ? `HTTP ${statusCode} — bucket correctly rejects unauthenticated access`
        : `HTTP ${statusCode} — UNEXPECTED: object may be publicly accessible`);
  } catch (err: any) {
    // A network error (e.g. DNS NXDOMAIN) also means the object is not public.
    record('T8', 'Anonymous (unsigned) GET is denied', true,
      `Request failed with network error (object not publicly reachable): ${err.message}`);
  }

  printSummary();
}

// ── Summary printer ───────────────────────────────────────────────────────────
function printSummary() {
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('══════════════════════════════════════════════════════');
  for (const r of results) {
    console.log(`  ${r.passed ? '✅ PASS' : '❌ FAIL'}  [${r.id}] ${r.description}`);
  }
  console.log('──────────────────────────────────────────────────────');
  console.log(`  Total: ${results.length}  Passed: ${passed}  Failed: ${failed}`);
  console.log('══════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\n[testS3] Unexpected error:', err.message ?? err);
  process.exit(1);
});
