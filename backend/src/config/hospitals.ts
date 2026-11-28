// Centralized hospital list — kept in sync with frontend/lib/hospitals.ts
// Do NOT create a MongoDB collection for this. This is a static reference list.

export const HOSPITAL_NAMES: string[] = [
  "KLES Dr. Prabhakar Kore Hospital & Medical Research Centre (MRC)",
  "KLES Dr. Prabhakar Kore Charitable Hospital & MRC",
  "KLE Dr. Sampatkumar S. Shivanagi Cancer Hospital (KLE Belgaum Cancer Hospital)",
  "KLE Centenary Charitable Hospital & MRC",
  "KLE Ayurved Hospital and Medical Research Centre",
  "KLE Vishwanath Katti Dental Hospital & Research Centre",
  "KLE Hospital & Medical Research Centre",
  "KLE Society's Hospital (I.C.U.)",
  "KLE Society's Dr. Prabhakar Kore Hospital Intensive Care Unit",
  "KLE Society's Ayurvedic Hospital",
  "KLE Society's Dr. Kamal Hospital & Medical Research Centre",
  "KLE Hospital",
  "KLES Dental Hospital & Research Centre",
]

export const VALID_HOSPITAL_NAMES = new Set(HOSPITAL_NAMES)

export const isValidHospital = (name: string): boolean =>
  VALID_HOSPITAL_NAMES.has(name)
