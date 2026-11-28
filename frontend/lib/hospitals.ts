export interface Hospital {
  id: string
  name: string
  city: string
  location: string
}

export const HOSPITALS: Hospital[] = [
  // Belagavi
  {
    id: 'kle-mrc-nehru',
    name: "KLES Dr. Prabhakar Kore Hospital & Medical Research Centre (MRC)",
    city: 'Belagavi',
    location: 'Nehru Nagar',
  },
  {
    id: 'kle-charitable-nehru',
    name: "KLES Dr. Prabhakar Kore Charitable Hospital & MRC",
    city: 'Belagavi',
    location: 'Nehru Nagar',
  },
  {
    id: 'kle-cancer-belagavi',
    name: "KLE Dr. Sampatkumar S. Shivanagi Cancer Hospital (KLE Belgaum Cancer Hospital)",
    city: 'Belagavi',
    location: 'Belagavi',
  },
  {
    id: 'kle-centenary-vadgaon',
    name: "KLE Centenary Charitable Hospital & MRC",
    city: 'Belagavi',
    location: 'Yellur Road, Vadgaon',
  },
  {
    id: 'kle-ayurved-shahapur',
    name: "KLE Ayurved Hospital and Medical Research Centre",
    city: 'Belagavi',
    location: 'Shahapur',
  },
  {
    id: 'kle-dental-nehru',
    name: "KLE Vishwanath Katti Dental Hospital & Research Centre",
    city: 'Belagavi',
    location: 'Nehru Nagar',
  },
  // Hubballi
  {
    id: 'kle-hubballi-gabbur',
    name: "KLE Hospital & Medical Research Centre",
    city: 'Hubballi',
    location: 'Gabbur Cross',
  },
  // Gokak
  {
    id: 'kle-gokak-main',
    name: "KLE Society's Hospital (I.C.U.)",
    city: 'Gokak',
    location: 'Main Road',
  },
  // Chikkodi
  {
    id: 'kle-chikkodi-icu',
    name: "KLE Society's Dr. Prabhakar Kore Hospital Intensive Care Unit",
    city: 'Chikkodi',
    location: 'Basava Circle',
  },
  {
    id: 'kle-ayurvedic-chikkodi',
    name: "KLE Society's Ayurvedic Hospital",
    city: 'Chikkodi',
    location: 'Chikkodi',
  },
  // Ankola
  {
    id: 'kle-kamal-ankola',
    name: "KLE Society's Dr. Kamal Hospital & Medical Research Centre",
    city: 'Ankola',
    location: 'Uttara Kannada district',
  },
  // Bengaluru
  {
    id: 'kle-bengaluru-yeshwanthpur',
    name: "KLE Hospital",
    city: 'Bengaluru',
    location: 'Yeshwanthpur / Tumkur Road area',
  },
  {
    id: 'kles-dental-bengaluru',
    name: "KLES Dental Hospital & Research Centre",
    city: 'Bengaluru',
    location: 'Bengaluru',
  },
]

// Unique cities in display order
export const HOSPITAL_CITIES = Array.from(new Set(HOSPITALS.map(h => h.city)))

// Valid hospital names for backend validation
export const VALID_HOSPITAL_NAMES = new Set(HOSPITALS.map(h => h.name))

// Lookup by id
export const getHospitalById = (id: string): Hospital | undefined =>
  HOSPITALS.find(h => h.id === id)

// Lookup by name (for existing doctor profiles)
export const getHospitalByName = (name: string): Hospital | undefined =>
  HOSPITALS.find(h => h.name === name)
