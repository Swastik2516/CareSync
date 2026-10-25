import { Schema, model } from 'mongoose';

const availabilitySchema = new Schema({
  doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  capacity: { type: Number, default: 10 }
});

availabilitySchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

export const Availability = model('Availability', availabilitySchema);
