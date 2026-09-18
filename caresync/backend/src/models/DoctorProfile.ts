import { Schema, model } from 'mongoose';

const doctorProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialization: { type: String, required: true, index: true },
  hospital: { type: String, required: true },
  experience: { type: Number, required: true },
  consultationFee: { type: Number, required: true },
  bio: { type: String, required: true },
  rating: { type: Number, default: 5.0 },
  profileImage: { type: String, default: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400' }
});

export const DoctorProfile = model('DoctorProfile', doctorProfileSchema);
