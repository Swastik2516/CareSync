"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReport = exports.getReportFile = exports.getMyReports = exports.uploadReport = void 0;
const MedicalReport_1 = require("../models/MedicalReport");
const uploadReport = async (req, res) => {
    try {
        const { name, fileType, fileData, healthCondition, prescribedTablets } = req.body;
        if (!name || !fileType || !fileData)
            return res.status(400).json({ error: 'name, fileType and fileData are required' });
        const report = await MedicalReport_1.MedicalReport.create({
            patientId: req.user?.userId,
            name,
            fileType,
            fileData,
            healthCondition: healthCondition ?? '',
            prescribedTablets: prescribedTablets ?? '',
        });
        return res.status(201).json({
            _id: report._id,
            name: report.name,
            fileType: report.fileType,
            healthCondition: report.healthCondition,
            prescribedTablets: report.prescribedTablets,
            uploadedAt: report.uploadedAt,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.uploadReport = uploadReport;
const getMyReports = async (req, res) => {
    try {
        const reports = await MedicalReport_1.MedicalReport.find({ patientId: req.user?.userId })
            .select('-fileData').sort({ uploadedAt: -1 });
        return res.json(reports);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getMyReports = getMyReports;
const getReportFile = async (req, res) => {
    try {
        const report = await MedicalReport_1.MedicalReport.findOne({ _id: req.params.id, patientId: req.user?.userId });
        if (!report)
            return res.status(404).json({ error: 'Report not found' });
        return res.json({ fileData: report.fileData, fileType: report.fileType, name: report.name });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getReportFile = getReportFile;
const deleteReport = async (req, res) => {
    try {
        const report = await MedicalReport_1.MedicalReport.findOneAndDelete({ _id: req.params.id, patientId: req.user?.userId });
        if (!report)
            return res.status(404).json({ error: 'Report not found' });
        return res.json({ message: 'Report deleted' });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.deleteReport = deleteReport;
