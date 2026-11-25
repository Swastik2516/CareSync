/**
 * tests/medicalReportModel.test.ts
 * Tests for the extended MedicalReport Mongoose schema.
 */
import mongoose from 'mongoose';
import { MedicalReport } from '../src/models/MedicalReport';
import { connectTestDB, disconnectTestDB, clearCollections } from './helpers';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });
afterEach(async () => { await clearCollections(); });

const patientId = new mongoose.Types.ObjectId();

describe('MedicalReport model — backward compatibility', () => {
  it('T22 — creates a Cloudinary record with legacy fields', async () => {
    const doc = await MedicalReport.create({
      patientId,
      name:      'Blood Test',
      fileType:  'image/jpeg',
      fileUrl:   'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      publicId:  'caresync/reports/sample',
      healthCondition:   'Anaemia',
      prescribedTablets: 'Iron tablets',
    });
    expect(doc.fileUrl).toContain('cloudinary.com');
    expect(doc.publicId).toBe('caresync/reports/sample');
    expect(doc.storageProvider).toBe('cloudinary');
    expect(doc.uploadStatus).toBe('verified');
    expect(doc.s3Key).toBe('');
  });

  it('T23 — existing Cloudinary record defaults storageProvider to cloudinary', async () => {
    const doc = await MedicalReport.create({
      patientId,
      name:     'X-Ray',
      fileType: 'image/png',
      fileUrl:  'https://res.cloudinary.com/demo/image/upload/xray.png',
      publicId: 'caresync/reports/xray',
    });
    expect(doc.storageProvider).toBe('cloudinary');
    expect(doc.uploadStatus).toBe('verified');
  });
});

describe('MedicalReport model — S3 fields', () => {
  it('T24 — creates a pending S3 record with all new fields', async () => {
    const uploadedBy = new mongoose.Types.ObjectId();
    const doc = await MedicalReport.create({
      patientId,
      name:             'MRI Scan',
      fileType:         'application/pdf',
      fileUrl:          '',
      publicId:         '',
      storageProvider:  's3',
      s3Key:            'medical-reports/abc123/uuid-scan.pdf',
      originalFileName: 'mri-scan.pdf',
      mimeType:         'application/pdf',
      fileSize:         204800,
      uploadedBy,
      uploadStatus:     'pending',
      presignExpiresAt: new Date(Date.now() + 600000),
    });
    expect(doc.storageProvider).toBe('s3');
    expect(doc.s3Key).toBe('medical-reports/abc123/uuid-scan.pdf');
    expect(doc.uploadStatus).toBe('pending');
    expect(doc.fileUrl).toBe('');
    expect(doc.publicId).toBe('');
    expect(doc.fileSize).toBe(204800);
  });

  it('T25 — uploadStatus transitions: pending -> verified', async () => {
    const doc = await MedicalReport.create({
      patientId,
      name:            'Prescription',
      fileType:        'application/pdf',
      fileUrl:         '',
      publicId:        '',
      storageProvider: 's3',
      s3Key:           'medical-reports/abc/uuid.pdf',
      mimeType:        'application/pdf',
      uploadStatus:    'pending',
    });
    await MedicalReport.findByIdAndUpdate(doc._id, {
      uploadStatus: 'verified',
      verifiedAt:   new Date(),
      presignExpiresAt: null,
    });
    const updated = await MedicalReport.findById(doc._id);
    expect(updated?.uploadStatus).toBe('verified');
    expect(updated?.verifiedAt).toBeTruthy();
    expect(updated?.presignExpiresAt).toBeNull();
  });

  it('T26 — rejects invalid uploadStatus value', async () => {
    await expect(MedicalReport.create({
      patientId,
      name:            'Bad',
      fileType:        'application/pdf',
      fileUrl:         '',
      publicId:        '',
      storageProvider: 's3',
      s3Key:           'test/key.pdf',
      mimeType:        'application/pdf',
      uploadStatus:    'invalid-status',
    })).rejects.toThrow();
  });

  it('T27 — rejects invalid storageProvider value', async () => {
    await expect(MedicalReport.create({
      patientId,
      name:            'Bad',
      fileType:        'application/pdf',
      fileUrl:         '',
      publicId:        '',
      storageProvider: 'dropbox',
      s3Key:           'test/key.pdf',
      mimeType:        'application/pdf',
    })).rejects.toThrow();
  });

  it('T28 — does not store presigned URLs in any field', async () => {
    const doc = await MedicalReport.create({
      patientId,
      name:            'Report',
      fileType:        'application/pdf',
      fileUrl:         '',
      publicId:        '',
      storageProvider: 's3',
      s3Key:           'medical-reports/abc/uuid.pdf',
      mimeType:        'application/pdf',
      uploadStatus:    'verified',
    });
    const raw = doc.toObject() as Record<string, unknown>;
    const allValues = JSON.stringify(raw);
    expect(allValues).not.toContain('X-Amz-Signature');
    expect(allValues).not.toContain('AWSAccessKeyId');
    expect(allValues).not.toContain('x-amz-credential');
  });
});
