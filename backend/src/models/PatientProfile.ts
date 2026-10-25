import { Schema, model } from 'mongoose';

const patientProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  profileImage: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400' }
});

export const PatientProfile = model('PatientProfile', patientProfileSchema);
