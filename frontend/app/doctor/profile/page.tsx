'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { Camera, LayoutDashboard, Save, Trash2, X, Building2, ChevronDown, MapPin } from 'lucide-react'
import { HOSPITALS, HOSPITAL_CITIES, getHospitalByName } from '@/lib/hospitals'

export default function DoctorProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    specialization: '', hospital: '', experience: '', consultationFee: '', bio: ''
  })
  const [profileImage, setProfileImage] = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [message, setMessage]         = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hospitalSearch, setHospitalSearch]           = useState('')
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    try {
      const userId = JSON.parse(atob(token.split('.')[1])).userId
      apiClient.get(`/doctors/${userId}`)
        .then(res => {
          const d = res.data
          setForm({
            specialization:  d.specialization  ?? '',
            hospital:        d.hospital        ?? '',
            experience:      String(d.experience      ?? ''),
            consultationFee: String(d.consultationFee ?? ''),
            bio:             d.bio             ?? '',
          })
          setProfileImage(d.profileImage ?? '')
        })
        .catch(() => setMessage('Could not load profile'))
        .finally(() => setLoading(false))
    } catch {
      router.push('/login')
    }
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setMessage('')
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const res = await apiClient.post('/doctors/profile-image', { fileData: base64, fileType: file.type })
        setProfileImage(res.data.profileImage)
        setMessage('✅ Profile photo updated!')
      } catch (err: any) {
        setMessage(`❌ ${err.response?.data?.error ?? 'Image upload failed'}`)
      } finally {
        setUploadingImage(false)
      }
    }
    reader.onerror = () => {
      setMessage('❌ Failed to read image file')
      setUploadingImage(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await apiClient.patch('/doctors/profile', {
        ...form,
        experience:      Number(form.experience),
        consultationFee: Number(form.consultationFee),
      })
      setMessage('✅ Profile updated successfully!')
      setSaved(true)
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.error ?? 'Update failed'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await apiClient.delete('/auth/account')
      localStorage.clear()
      router.push('/register')
    } catch (err: any) {
      setMessage(`❌ ${err.response?.data?.error ?? 'Delete failed'}`)
      setShowDeleteModal(false)
    } finally {
      setDeleting(false)
    }
  }

  const filteredHospitals = HOSPITALS.filter(h =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.location.toLowerCase().includes(hospitalSearch.toLowerCase())
  )

  const selectedHospital = getHospitalByName(form.hospital)

  const field = (label: string, key: keyof typeof form, type = 'text', rows?: number) => (
    <div>
      <label className="text-xs font-bold text-gray-700">{label}</label>
      {rows ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={rows}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 text-sm outline-none focus:border-indigo-400 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 text-sm outline-none focus:border-indigo-400"
        />
      )}
    </div>
  )

  return (
    <DoctorSidebar>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">

            {/* Profile Photo */}
            <div className="flex flex-col items-center pb-2">
              <div
                className="relative w-24 h-24 rounded-full cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center border-4 border-indigo-200">
                    <Camera size={32} className="text-indigo-400" />
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera size={20} className="text-white" />
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">Tap to change photo</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {field('Specialization', 'specialization')}

            {/* Hospital Searchable Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-700">Hospital / Clinic</label>
              <div className="relative mt-1">
                <button type="button" onClick={() => setHospitalDropdownOpen(o => !o)}
                  className={`w-full border rounded-2xl pl-10 pr-10 py-3 text-sm text-left outline-none transition ${
                    form.hospital ? 'text-gray-900 border-indigo-400' : 'text-gray-400 border-gray-200'
                  } focus:border-indigo-400`}>
                  <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${hospitalDropdownOpen ? 'rotate-180' : ''}`} />
                  <span className="block truncate">{form.hospital || 'Select a hospital...'}</span>
                </button>

                {hospitalDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <input autoFocus type="text" placeholder="Search hospital or city..."
                        value={hospitalSearch} onChange={e => setHospitalSearch(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400" />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {HOSPITAL_CITIES.filter(city =>
                        filteredHospitals.some(h => h.city === city)
                      ).map(city => (
                        <div key={city}>
                          <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50">
                            {city}
                          </div>
                          {filteredHospitals.filter(h => h.city === city).map(h => (
                            <button key={h.id} type="button"
                              onClick={() => {
                                setForm(p => ({ ...p, hospital: h.name }))
                                setHospitalDropdownOpen(false)
                                setHospitalSearch('')
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 transition flex items-start gap-2 ${
                                form.hospital === h.name ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                              }`}>
                              <MapPin size={13} className="shrink-0 mt-0.5 text-gray-400" />
                              <div>
                                <p className="font-medium leading-snug">{h.name}</p>
                                <p className="text-[11px] text-gray-400">{h.location}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                      {filteredHospitals.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-6">No hospitals found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {selectedHospital && (
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin size={11} /> {selectedHospital.city} — {selectedHospital.location}
                </p>
              )}
            </div>

            {field('Years of Experience', 'experience', 'number')}
            {field('Consultation Fee (₹)', 'consultationFee', 'number')}
            {field('Bio', 'bio', 'text', 3)}

            {message && (
              <p className={`text-xs px-4 py-3 rounded-xl ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl disabled:opacity-50 transition shadow-md"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {saved && (
              <button
                type="button"
                onClick={() => router.push('/doctor/dashboard')}
                className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3 rounded-2xl border border-green-200 transition"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </button>
            )}

            {/* Delete Account */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl border border-red-200 transition"
              >
                <Trash2 size={16} />
                Delete My Account
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                This will permanently delete your account and all your appointments.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete Account</h2>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete your doctor account? All your appointments and data will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl disabled:opacity-50 transition"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorSidebar>
  )
}
