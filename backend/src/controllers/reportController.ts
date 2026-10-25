import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MedicalReport } from '../models/MedicalReport';
import cloudinary from '../config/cloudinary';

export const uploadReport = async (req: AuthRequest, res: Response) => {
  try {
    const { name, fileType, fileData, healthCondition, prescribedTablets } = req.body;
    if (!name || !fileType || !fileData)
      return res.status(400).json({ error: 'name, fileType and fileData are required' });

    const resourceType = fileType.startsWith('image/') ? 'image' : 'raw';
    const uploaded = await cloudinary.uploader.upload(fileData, {
      folder: 'caresync/reports',
      resource_type: resourceType,
    });

    const report = await MedicalReport.create({
      patientId:         req.user?.userId,
      name,
      fileType,
      fileUrl:           uploaded.secure_url,
      publicId:          uploaded.public_id,
      healthCondition:   healthCondition ?? '',
      prescribedTablets: prescribedTablets ?? '',
    });

    return res.status(201).json({
      _id:               report._id,
      name:              report.name,
      fileType:          report.fileType,
      fileUrl:           report.fileUrl,
      healthCondition:   report.healthCondition,
      prescribedTablets: report.prescribedTablets,
      uploadedAt:        report.uploadedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getMyReports = async (req: AuthRequest, res: Response) => {
  try {
    const reports = await MedicalReport.find({ patientId: req.user?.userId })
      .select('-publicId').sort({ uploadedAt: -1 });
    return res.json(reports);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getReportFile = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, patientId: req.user?.userId });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.json({ fileUrl: report.fileUrl, fileType: report.fileType, name: report.name });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const report = await MedicalReport.findOne({ _id: req.params.id, patientId: req.user?.userId });
    if (!report) return res.status(404).json({ error: 'Report not found' });
    const resourceType = report.fileType.startsWith('image/') ? 'image' : ('raw' as any);
    await cloudinary.uploader.destroy(report.publicId, { resource_type: resourceType });
    await report.deleteOne();
    return res.json({ message: 'Report deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
