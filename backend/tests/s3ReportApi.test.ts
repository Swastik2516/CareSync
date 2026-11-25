/**
 * tests/s3ReportApi.test.ts
 *
 * Integration tests for S3 medical report API endpoints.
 * S3 calls are mocked. MongoDB uses an in-memory server.
 *
 * Key pattern: MongoMemoryServer is started and MONGO_URI is set in
 * beforeAll BEFORE app is imported, so the lazy DB middleware in app.ts
 * connects to the in-memory server instead of a real MongoDB instance.
 */

// ── Mock S3 service and config BEFORE any other import ───────────────────────
const mockCreateS3PresignedPost  = jest.fn();
const mockGetPresignedDownloadUrl = jest.fn();
const mockGetObjectMetadata       = jest.fn();
const mockValidateFileMagicBytes  = jest.fn();
const mockIsS3Configured          = jest.fn().mockReturnValue(true);
const mockGenerateS3Key           = jest.fn().mockReturnValue('medical-reports/abc123/test-uuid.pdf');

jest.mock('../src/services/s3Service', () => ({
  createS3PresignedPost:   (...a: any[]) => mockCreateS3PresignedPost(...a),
  getPresignedDownloadUrl: (...a: any[]) => mockGetPresignedDownloadUrl(...a),
  getObjectMetadata:       (...a: any[]) => mockGetObjectMetadata(...a),
  validateFileMagicBytes:  (...a: any[]) => mockValidateFileMagicBytes(...a),
  generateS3Key:           (...a: any[]) => mockGenerateS3Key(...a),
  ALLOWED_MIME_TYPES:      new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']),
  MAX_FILE_SIZE_BYTES:     10 * 1024 * 1024,
}));

jest.mock('../src/config/s3', () => ({
  isS3Configured: () => mockIsS3Configured(),
  getS3Client:    jest.fn(),
  getS3Bucket:    jest.fn().mockReturnValue('test-bucket'),
}));

// Mock the https module used by fetchFirstBytes in s3ReportController
jest.mock('https', () => ({
  request: jest.fn((_opts: any, cb: any) => {
    const mockRes = {
      on: (event: string, handler: any) => {
        if (event === 'data') handler(Buffer.from([0x25, 0x50, 0x44, 0x46])); // %PDF
        if (event === 'end')  handler();
        return mockRes;
      },
    };
    cb(mockRes);
    return { on: jest.fn(), write: jest.fn(), end: jest.fn() };
  }),
}));

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// These are imported AFTER MONGO_URI is set in beforeAll via jest.isolateModules
let app: any;
let MedicalReport: any;
let Appointment: any;
let User: any;

const TEST_JWT_SECRET = 'test-jwt-secret-api';

function makeToken(userId: string, role: 'PATIENT' | 'DOCTOR') {
  return jwt.sign({ userId, role }, TEST_JWT_SECRET, { expiresIn: '1h' });
}

let mongod: MongoMemoryServer;
let patientId: string;
let doctorId: string;
let otherPatientId: string;
let patientToken: string;
let doctorToken: string;
let otherPatientToken: string;

beforeAll(async () => {
  // 1. Start in-memory MongoDB and set MONGO_URI before app is loaded
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI      = mongod.getUri();
  process.env.JWT_SECRET     = TEST_JWT_SECRET;
  process.env.NODE_ENV       = 'test';
  process.env.FRONTEND_URL   = 'http://localhost:3000';

  // 2. Import app and models AFTER env vars are set
  //    jest.isolateModules ensures fresh module instances with the new env
  await jest.isolateModulesAsync(async () => {
    const appModule    = await import('../src/app');
    const reportModule = await import('../src/models/MedicalReport');
    const apptModule   = await import('../src/models/Appointment');
    const userModule   = await import('../src/models/User');
    app           = appModule.default;
    MedicalReport = reportModule.MedicalReport;
    Appointment   = apptModule.Appointment;
    User          = userModule.User;
  });

  // 3. Create test users
  const patient = await User.create({
    name: 'Test Patient', email: 'patient@test.com',
    phone: '1111111111', passwordHash: 'hash', role: 'PATIENT',
  });
  const doctor = await User.create({
    name: 'Test Doctor', email: 'doctor@test.com',
    phone: '2222222222', passwordHash: 'hash', role: 'DOCTOR',
  });
  const other = await User.create({
    name: 'Other Patient', email: 'other@test.com',
    phone: '3333333333', passwordHash: 'hash', role: 'PATIENT',
  });

  patientId      = patient._id.toString();
  doctorId       = doctor._id.toString();
  otherPatientId = other._id.toString();
  patientToken      = makeToken(patientId,      'PATIENT');
  doctorToken       = makeToken(doctorId,        'DOCTOR');
  otherPatientToken = makeToken(otherPatientId,  'PATIENT');
}, 120000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
}, 30000);

afterEach(async () => {
  // Clear only report and appointment collections between tests
  await MedicalReport.deleteMany({});
  await Appointment.deleteMany({});
  jest.clearAllMocks();
  mockIsS3Configured.mockReturnValue(true);
  mockGenerateS3Key.mockReturnValue('medical-reports/abc123/test-uuid.pdf');
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function createVerifiedS3Report(overrides: Record<string, unknown> = {}) {
  return MedicalReport.create({
    patientId,
    name: 'Test Report', fileType: 'application/pdf',
    fileUrl: '', publicId: '',
    storageProvider: 's3',
    s3Key: 'medical-reports/abc123/test-uuid.pdf',
    mimeType: 'application/pdf', fileSize: 1024,
    uploadedBy: patientId, uploadStatus: 'verified', verifiedAt: new Date(),
    ...overrides,
  });
}

async function createCloudinaryReport() {
  return MedicalReport.create({
    patientId,
    name: 'Old Cloudinary Report', fileType: 'image/jpeg',
    fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    publicId: 'caresync/reports/sample',
    storageProvider: 'cloudinary', uploadStatus: 'verified',
  });
}

async function createAppointmentLink() {
  return Appointment.create({
    appointmentId: `CS-TEST-${Date.now()}`,
    doctorId, patientId,
    date: '2025-12-01', timeSlot: '10:00', reason: 'Checkup',
    status: 'COMPLETED', amount: 500, paymentStatus: 'PAID',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/presign-upload
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reports/presign-upload', () => {
  beforeEach(() => {
    mockCreateS3PresignedPost.mockResolvedValue({
      url: 'https://s3.amazonaws.com/test-bucket',
      fields: { key: 'medical-reports/abc123/test-uuid.pdf', 'Content-Type': 'application/pdf' },
    });
  });

  it('T29 — unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .send({ fileName: 'test.pdf', mimeType: 'application/pdf', fileSize: 1024, name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('T30 — DOCTOR role returns 403', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ fileName: 'test.pdf', mimeType: 'application/pdf', fileSize: 1024, name: 'Test' });
    expect(res.status).toBe(403);
  });

  it('T31 — PATIENT gets presigned POST for valid PDF', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'report.pdf', mimeType: 'application/pdf', fileSize: 2048, name: 'Blood Test' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('pendingReportId');
    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('fields');
    expect(mockCreateS3PresignedPost).toHaveBeenCalledTimes(1);
  });

  it('T32 — creates a pending MongoDB record', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'report.pdf', mimeType: 'application/pdf', fileSize: 2048, name: 'Blood Test' });
    expect(res.status).toBe(201);
    const record = await MedicalReport.findById(res.body.pendingReportId);
    expect(record).toBeTruthy();
    expect(record?.uploadStatus).toBe('pending');
    expect(record?.storageProvider).toBe('s3');
    expect(record?.patientId.toString()).toBe(patientId);
  });

  it('T33 — rejects invalid MIME type (application/exe)', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'virus.exe', mimeType: 'application/exe', fileSize: 1024, name: 'Bad' });
    expect(res.status).toBe(400);
    expect(mockCreateS3PresignedPost).not.toHaveBeenCalled();
  });

  it('T34 — rejects declared file size exceeding 10 MB', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'big.pdf', mimeType: 'application/pdf', fileSize: 11 * 1024 * 1024, name: 'Big' });
    expect(res.status).toBe(400);
    expect(mockCreateS3PresignedPost).not.toHaveBeenCalled();
  });

  it('T35 — rejects missing required fields', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ mimeType: 'application/pdf' });
    expect(res.status).toBe(400);
  });

  it('T36 — returns 503 when S3 is not configured', async () => {
    mockIsS3Configured.mockReturnValue(false);
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'report.pdf', mimeType: 'application/pdf', fileSize: 1024, name: 'Test' });
    expect(res.status).toBe(503);
  });

  it('T37 — pending record patientId matches authenticated user (no IDOR)', async () => {
    const res = await request(app).post('/api/reports/presign-upload')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ fileName: 'report.pdf', mimeType: 'application/pdf', fileSize: 1024, name: 'Test' });
    const record = await MedicalReport.findById(res.body.pendingReportId);
    expect(record?.patientId.toString()).toBe(patientId);
    expect(record?.patientId.toString()).not.toBe(otherPatientId);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reports/confirm-upload
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/reports/confirm-upload', () => {
  let pendingReportId: string;

  beforeEach(async () => {
    const pending = await MedicalReport.create({
      patientId, name: 'Pending Report', fileType: 'application/pdf',
      fileUrl: '', publicId: '',
      storageProvider: 's3', s3Key: 'medical-reports/abc123/test-uuid.pdf',
      mimeType: 'application/pdf', fileSize: 1024,
      uploadedBy: patientId, uploadStatus: 'pending',
      presignExpiresAt: new Date(Date.now() + 600000),
    });
    pendingReportId = pending._id.toString();
    mockGetObjectMetadata.mockResolvedValue({
      ContentType: 'application/pdf', ContentLength: 1024,
      ServerSideEncryption: 'AES256', ETag: '"abc123"',
    });
    mockGetPresignedDownloadUrl.mockResolvedValue('https://s3.amazonaws.com/presigned-get');
    mockValidateFileMagicBytes.mockReturnValue(true);
  });

  it('T38 — unauthenticated request returns 401', async () => {
    const res = await request(app).post('/api/reports/confirm-upload').send({ pendingReportId });
    expect(res.status).toBe(401);
  });

  it('T39 — DOCTOR role returns 403', async () => {
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${doctorToken}`).send({ pendingReportId });
    expect(res.status).toBe(403);
  });

  it('T40 — owner patient confirms upload successfully', async () => {
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(200);
    expect(res.body.uploadStatus).toBe('verified');
    const record = await MedicalReport.findById(pendingReportId);
    expect(record?.uploadStatus).toBe('verified');
    expect(record?.verifiedAt).toBeTruthy();
  });

  it('T41 — other patient cannot confirm another patient upload (IDOR)', async () => {
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${otherPatientToken}`).send({ pendingReportId });
    expect(res.status).toBe(403);
    const record = await MedicalReport.findById(pendingReportId);
    expect(record?.uploadStatus).toBe('pending');
  });

  it('T42 — duplicate confirmation is idempotent (returns 200)', async () => {
    await MedicalReport.findByIdAndUpdate(pendingReportId, { uploadStatus: 'verified', verifiedAt: new Date() });
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(200);
    expect(res.body.message).toContain('already confirmed');
  });

  it('T43 — expired pending record returns 410', async () => {
    await MedicalReport.findByIdAndUpdate(pendingReportId, { presignExpiresAt: new Date(Date.now() - 1000) });
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(410);
    const record = await MedicalReport.findById(pendingReportId);
    expect(record?.uploadStatus).toBe('rejected');
  });

  it('T44 — HeadObject returns null (file not in S3) returns 422', async () => {
    mockGetObjectMetadata.mockResolvedValue(null);
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(422);
  });

  it('T45 — ContentType mismatch returns 422 and marks rejected', async () => {
    mockGetObjectMetadata.mockResolvedValue({ ContentType: 'image/jpeg', ContentLength: 1024 });
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(422);
    const record = await MedicalReport.findById(pendingReportId);
    expect(record?.uploadStatus).toBe('rejected');
  });

  it('T46 — file exceeding 10 MB in S3 returns 422', async () => {
    mockGetObjectMetadata.mockResolvedValue({ ContentType: 'application/pdf', ContentLength: 11 * 1024 * 1024 });
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(422);
  });

  it('T47 — magic bytes fail sets status to uploaded (not verified)', async () => {
    mockValidateFileMagicBytes.mockReturnValue(false);
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId });
    expect(res.status).toBe(200);
    const record = await MedicalReport.findById(pendingReportId);
    expect(record?.uploadStatus).toBe('uploaded');
  });

  it('T48 — invalid MongoDB ID returns 400', async () => {
    const res = await request(app).post('/api/reports/confirm-upload')
      .set('Authorization', `Bearer ${patientToken}`).send({ pendingReportId: 'not-a-valid-id' });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/:id/download
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/reports/:id/download', () => {
  beforeEach(() => {
    mockGetPresignedDownloadUrl.mockResolvedValue('https://s3.amazonaws.com/presigned-get');
  });

  it('T49 — unauthenticated request returns 401', async () => {
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`);
    expect(res.status).toBe(401);
  });

  it('T50 — patient downloads their own verified S3 report', async () => {
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('fileUrl');
    expect(res.body.source).toBe('s3');
    expect(res.body.expiresIn).toBe(300);
    expect(mockGetPresignedDownloadUrl).toHaveBeenCalledTimes(1);
  });

  it('T51 — other patient cannot download (IDOR prevention)', async () => {
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${otherPatientToken}`);
    expect(res.status).toBe(403);
    expect(mockGetPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('T52 — doctor with appointment can download patient report', async () => {
    await createAppointmentLink();
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('s3');
  });

  it('T53 — doctor without appointment cannot download (403)', async () => {
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${doctorToken}`);
    expect(res.status).toBe(403);
    expect(mockGetPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('T54 — pending S3 report cannot be downloaded (403)', async () => {
    const report = await createVerifiedS3Report({ uploadStatus: 'pending' });
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
    expect(mockGetPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('T55 — uploaded (unverified) S3 report cannot be downloaded (403)', async () => {
    const report = await createVerifiedS3Report({ uploadStatus: 'uploaded' });
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(403);
  });

  it('T56 — Cloudinary report returns fileUrl directly (backward compat)', async () => {
    const report = await createCloudinaryReport();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('cloudinary');
    expect(res.body.fileUrl).toContain('cloudinary.com');
    expect(mockGetPresignedDownloadUrl).not.toHaveBeenCalled();
  });

  it('T57 — response has Cache-Control: no-store header', async () => {
    const report = await createVerifiedS3Report();
    const res = await request(app).get(`/api/reports/${report._id}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('T58 — non-existent report returns 404', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/reports/${fakeId}/download`)
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports — backward compatibility
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/reports — backward compatibility', () => {
  it('T59 — returns both Cloudinary and verified S3 reports', async () => {
    await createCloudinaryReport();
    await createVerifiedS3Report();
    const res = await request(app).get('/api/reports')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('T60 — does not return pending S3 reports in list', async () => {
    await createCloudinaryReport();
    await MedicalReport.create({
      patientId, name: 'Pending', fileType: 'application/pdf',
      fileUrl: '', publicId: '',
      storageProvider: 's3', s3Key: 'test/key.pdf',
      mimeType: 'application/pdf', uploadStatus: 'pending',
      presignExpiresAt: new Date(Date.now() + 600000),
    });
    const res = await request(app).get('/api/reports')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].storageProvider).toBe('cloudinary');
  });

  it('T61 — does not expose s3Key or presignExpiresAt in list response', async () => {
    await createVerifiedS3Report();
    const res = await request(app).get('/api/reports')
      .set('Authorization', `Bearer ${patientToken}`);
    expect(res.status).toBe(200);
    const report = res.body[0];
    expect(report).not.toHaveProperty('s3Key');
    expect(report).not.toHaveProperty('presignExpiresAt');
    expect(report).not.toHaveProperty('publicId');
  });
});
