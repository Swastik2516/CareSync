'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import PatientSidebar from '@/components/PatientSidebar'
import apiClient from '@/lib/api'
import { Search, Star, ShieldCheck, Building2, MapPin, ChevronDown, ArrowLeft, RefreshCw } from 'lucide-react'
import { HOSPITALS, HOSPITAL_CITIES, getHospitalByName } from '@/lib/hospitals'

type Step = 'SELECT_HOSPITAL' | 'LIST_DOCTORS'

export default function DoctorsPage() {
  const router = useRouter()

  // Hospital selection
  const [step, setStep]                               = useState<Step>('SELECT_HOSPITAL')
  const [selectedHospitalName, setSelectedHospitalName] = useState('')
  const [hospitalSearch, setHospitalSearch]           = useState('')

  // Doctor listing
  const [doctors, setDoctors]   = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
  }, [router])

  // Fetch doctors whenever hospital changes — abort previous in-flight request
  useEffect(() => {
    if (!selectedHospitalName) return
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setDoctors([])
    apiClient.get(`/doctors?hospital=${encodeURIComponent(selectedHospitalName)}`, { signal: controller.signal })
      .then(r => setDoctors(r.data))
      .catch(err => {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return
        setError('Failed to load doctors. Please try again.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [selectedHospitalName])

  const filteredHospitals = useMemo(() => HOSPITALS.filter(h =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.location.toLowerCase().includes(hospitalSearch.toLowerCase())
  ), [hospitalSearch])

  const filteredDoctors = useMemo(() => doctors.filter(d =>
    d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  ), [doctors, search])

  const selectedHospital = getHospitalByName(selectedHospitalName)

  const handleSelectHospital = (name: string) => {
    setSelectedHospitalName(name)
    setSearch('')
    setStep('LIST_DOCTORS')
  }

  const handleChangeHospital = () => {
    setStep('SELECT_HOSPITAL')
    setHospitalSearch('')
    setDoctors([])
    setError('')
  }

  // ── Hospital Selection Step ──────────────────────────────────────────────────
  if (step === 'SELECT_HOSPITAL') {
    return (
      <PatientSidebar>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Find Your Specialist</h1>
          <p className="text-gray-500 mt-1 mb-6">Select a KLE hospital to view available doctors.</p>

          {/* Search */}
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-5 gap-3 shadow-sm">
            <Search size={18} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              placeholder="Search hospital, city or location..."
              value={hospitalSearch}
              onChange={e => setHospitalSearch(e.target.value)}
              className="flex-1 text-sm text-gray-900 outline-none"
            />
            {hospitalSearch && (
              <button onClick={() => setHospitalSearch('')} className="text-gray-400 hover:text-gray-600">
                <RefreshCw size={14} />
              </button>
            )}
          </div>

          {/* Grouped hospital list */}
          <div className="space-y-4">
            {HOSPITAL_CITIES.filter(city => filteredHospitals.some(h => h.city === city)).map(city => (
              <div key={city}>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">{city}</p>
                <div className="space-y-2">
                  {filteredHospitals.filter(h => h.city === city).map(h => (
                    <button
                      key={h.id}
                      onClick={() => handleSelectHospital(h.name)}
                      className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 hover:border-indigo-300 hover:shadow-md transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition">
                        <Building2 size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 leading-snug">{h.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={11} className="shrink-0" />{h.location}
                        </p>
                      </div>
                      <ChevronDown size={16} className="text-gray-300 group-hover:text-indigo-400 -rotate-90 shrink-0 mt-1 transition" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filteredHospitals.length === 0 && (
              <p className="text-center text-gray-400 py-12 text-sm">No hospitals match your search.</p>
            )}
          </div>
        </div>
      </PatientSidebar>
    )
  }

  // ── Doctor Listing Step ──────────────────────────────────────────────────────
  return (
    <PatientSidebar>
      <div className="max-w-4xl mx-auto">

        {/* Hospital header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{selectedHospitalName}</h1>
              {selectedHospital && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin size={11} />{selectedHospital.city} — {selectedHospital.location}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleChangeHospital}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition shrink-0"
          >
            <ArrowLeft size={13} /> Change Hospital
          </button>
        </div>

        {/* Doctor search */}
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-5 gap-3 shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            placeholder="Search doctor or specialization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-900 outline-none"
          />
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading doctors...
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-red-500 text-sm bg-red-50 rounded-2xl border border-red-100">
            {error}
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-600">No doctors are currently available at this hospital.</p>
            <p className="text-xs mt-1">Try selecting a different hospital.</p>
          </div>
        )}

        {!loading && !error && doctors.length > 0 && (
          <div className="grid gap-4">
            {filteredDoctors.map((doc: any) => (
              <div
                key={doc._id}
                onClick={() => router.push(`/patient/doctors/${doc.userId._id}?hospital=${encodeURIComponent(selectedHospitalName)}`)}
                className="bg-white border border-gray-100 rounded-3xl p-5 flex gap-4 cursor-pointer hover:shadow-md transition"
              >
                <img src={doc.profileImage} alt={doc.userId?.name} className="w-20 h-20 rounded-2xl object-cover bg-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 truncate">{doc.userId?.name}</span>
                    <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                  </div>
                  <p className="text-indigo-600 text-sm font-medium mt-0.5">{doc.specialization}</p>
                  <p className="text-gray-400 text-xs mt-1 truncate">{doc.hospital} • {doc.experience} yrs exp</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{doc.rating}</span>
                    </div>
                    <span className="font-bold text-indigo-900">₹{doc.consultationFee}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredDoctors.length === 0 && doctors.length > 0 && (
              <p className="text-center text-gray-400 py-10 text-sm">No doctors match your search.</p>
            )}
          </div>
        )}
      </div>
    </PatientSidebar>
  )
}
