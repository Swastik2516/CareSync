'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Check, X, Mail, Lock, User, Phone,
  Stethoscope, Building2, Award, IndianRupee, Calendar,
  ArrowRight, AlertCircle, Camera, ImagePlus, KeyRound, MapPin, ChevronDown
} from 'lucide-react'
import Image from 'next/image'
import apiClient from '@/lib/api'
import { HOSPITALS, HOSPITAL_CITIES } from '@/lib/hospitals'

const PASSWORD_RULES = [
  { label: 'At least 8 characters',        test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)',    test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)',    test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)',              test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special symbol (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function getStrength(password: string) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  if (passed <= 1) return { label: 'Very Weak',   color: 'bg-red-500',     text: 'text-red-400',     width: 'w-1/5' }
  if (passed === 2) return { label: 'Weak',        color: 'bg-orange-500',  text: 'text-orange-400',  width: 'w-2/5' }
  if (passed === 3) return { label: 'Fair',        color: 'bg-yellow-500',  text: 'text-yellow-400',  width: 'w-3/5' }
  if (passed === 4) return { label: 'Strong',      color: 'bg-blue-500',    text: 'text-blue-400',    width: 'w-4/5' }
  return              { label: 'Very Strong',  color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    dateOfBirth: '', gender: 'Male',
    specialization: '', hospital: '', experience: '', consultationFee: '', bio: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]       = useState(false)
  const [showConfirm, setShowConfirm]         = useState(false)
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [accessCode, setAccessCode]                   = useState('')
  const [hospitalSearch, setHospitalSearch]           = useState('')
  const [hospitalDropdownOpen, setHospitalDropdownOpen] = useState(false)
  const [profileImageFile, setProfileImageFile]       = useState<string | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [profileImageType, setProfileImageType]       = useState<string>('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const strength      = useMemo(() => getStrength(form.password), [form.password])
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(form.password))
  const passwordsMatch = form.password === confirmPassword && confirmPassword.length > 0
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProfileImageType(file.type)
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result as string
      setProfileImageFile(b64)
      setProfileImagePreview(b64)
    }
    reader.readAsDataURL(file)
  }

  const filteredHospitals = HOSPITALS.filter(h =>
    h.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    h.location.toLowerCase().includes(hospitalSearch.toLowerCase())
  )

  const selectedHospital = HOSPITALS.find(h => h.name === form.hospital)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRulesPassed)  return setError('Please satisfy all password requirements.')
    if (!passwordsMatch)  return setError('Passwords do not match.')
    if (role === 'DOCTOR' && accessCode !== 'KLE-HOSPITAL-1625') return setError('Invalid doctor access code.')
    if (role === 'DOCTOR' && !form.hospital) return setError('Please select your working hospital.')
    setLoading(true)
    setError('')
    try {
      const payload: any = { ...form, role }
      if (role === 'DOCTOR') {
        payload.experience      = Number(form.experience)
        payload.consultationFee = Number(form.consultationFee)
      }
      const { data } = await apiClient.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role',  data.role)
      localStorage.setItem('name',  data.name)

      if (role === 'DOCTOR' && profileImageFile) {
        try {
          await apiClient.post('/doctors/profile-image',
            { fileData: profileImageFile, fileType: profileImageType },
            { headers: { Authorization: `Bearer ${data.token}` } }
          )
        } catch (_) {}
      }

      router.push(data.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-start justify-center p-4 py-10">
      {/* Background orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/kle-logo.webp" alt="KLE Hospital" width={192} height={192} className="object-contain mx-auto mb-3 drop-shadow-xl" priority />
          <p className="font-black text-xl leading-snug bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text">
            KLE's Dr. Prabhakar Kore Hospital &<br />Medical Research Centre
          </p>

        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl p-6 sm:p-8 space-y-6">

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setRole('PATIENT')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'PATIENT'
                    ? 'bg-indigo-900/40 border-indigo-500 ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800/80'
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${role === 'PATIENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Patient</p>
                  <p className="text-[11px] text-slate-400">Book & track records</p>
                </div>
              </button>

              <button type="button" onClick={() => setRole('DOCTOR')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'DOCTOR'
                    ? 'bg-blue-900/40 border-blue-500 ring-1 ring-blue-500/50'
                    : 'bg-slate-800/40 border-slate-700/70 hover:bg-slate-800/80'
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${role === 'DOCTOR' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  <Stethoscope size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white">Doctor</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400">Manage appointments</p>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Basic Info */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="e.g. Dr. John Doe" value={form.name} onChange={set('name')} required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" placeholder="name@example.com" value={form.email} onChange={set('email')} required
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password"
                  value={form.password} onChange={set('password')} required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {form.password.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Password Strength</span>
                  <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                </div>
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(form.password)
                    return (
                      <div key={rule.label} className="flex items-center gap-1.5">
                        {ok ? <Check size={12} className="text-emerald-400 shrink-0" /> : <X size={12} className="text-slate-600 shrink-0" />}
                        <span className={`text-[11px] ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>{rule.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  className={`w-full bg-slate-800/60 border rounded-2xl pl-10 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition ${
                    confirmPassword.length > 0
                      ? passwordsMatch ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' : 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                  }`} />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <p className={`text-xs mt-1.5 flex items-center gap-1 ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passwordsMatch ? <><Check size={12} /> Passwords match</> : <><X size={12} /> Passwords do not match</>}
                </p>
              )}
            </div>

            {/* Patient fields */}
            {role === 'PATIENT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Gender</label>
                  <select value={form.gender} onChange={set('gender')}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    <option value="Male"   className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Other"  className="bg-slate-900">Other</option>
                  </select>
                </div>
              </div>
            )}

            {/* Doctor fields */}
            {role === 'DOCTOR' && (
              <div className="space-y-4">

                {/* Access Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Doctor Access Code</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" placeholder="Enter hospital access code" value={accessCode} onChange={e => setAccessCode(e.target.value)} required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Specialization</label>
                  <div className="relative">
                    <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="e.g. Cardiologist" value={form.specialization} onChange={set('specialization')} required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                </div>

                {/* Hospital Searchable Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Select Working Hospital <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <button type="button" onClick={() => setHospitalDropdownOpen(o => !o)}
                      className={`w-full bg-slate-800/60 border rounded-2xl pl-10 pr-10 py-3 text-sm text-left transition outline-none ${
                        form.hospital ? 'text-white border-indigo-500' : 'text-slate-500 border-slate-700/80'
                      } focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20`}>
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${hospitalDropdownOpen ? 'rotate-180' : ''}`} />
                      {selectedHospital ? (
                        <span className="block truncate">{selectedHospital.name}</span>
                      ) : 'Select a hospital...'}
                    </button>

                    {hospitalDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-2 border-b border-slate-800">
                          <input autoFocus type="text" placeholder="Search hospital or city..."
                            value={hospitalSearch} onChange={e => setHospitalSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500" />
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {HOSPITAL_CITIES.filter(city =>
                            filteredHospitals.some(h => h.city === city)
                          ).map(city => (
                            <div key={city}>
                              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50">
                                {city}
                              </div>
                              {filteredHospitals.filter(h => h.city === city).map(h => (
                                <button key={h.id} type="button"
                                  onClick={() => {
                                    setForm(f => ({ ...f, hospital: h.name }))
                                    setHospitalDropdownOpen(false)
                                    setHospitalSearch('')
                                  }}
                                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-800 transition flex items-start gap-2 ${
                                    form.hospital === h.name ? 'bg-indigo-900/40 text-indigo-300' : 'text-slate-300'
                                  }`}>
                                  <MapPin size={13} className="shrink-0 mt-0.5 text-slate-500" />
                                  <div>
                                    <p className="font-medium leading-snug">{h.name}</p>
                                    <p className="text-[11px] text-slate-500">{h.location}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ))}
                          {filteredHospitals.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-6">No hospitals found</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedHospital && (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {selectedHospital.city} — {selectedHospital.location}
                    </p>
                  )}
                </div>

                {/* Experience & Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Experience (Years)</label>
                    <input type="number" placeholder="e.g. 10" min="0" value={form.experience} onChange={set('experience')} required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Consultation Fee (₹)</label>
                    <div className="relative">
                      <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="number" placeholder="e.g. 500" min="0" value={form.consultationFee} onChange={set('consultationFee')} required
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Professional Bio</label>
                  <textarea placeholder="Brief background of your clinical practice, education, and patient care philosophy..."
                    value={form.bio} onChange={set('bio')} required rows={3}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none" />
                </div>

                {/* Profile Photo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                    Profile Photo <span className="text-slate-500 normal-case font-normal">(optional — shown to patients)</span>
                  </label>
                  <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-2xl border border-dashed border-slate-700 hover:border-indigo-500 transition">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                      {profileImagePreview
                        ? <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                        : <Camera size={22} className="text-slate-500 group-hover:text-indigo-400 transition" />}
                    </div>
                    <div>
                      <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        <ImagePlus size={15} className="text-indigo-400" />
                        {profileImagePreview ? 'Change photo' : 'Upload profile photo'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">JPG, PNG or WEBP</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>

              </div>
            )}

            {/* Submit */}
            <button type="submit"
              disabled={loading || !allRulesPassed || !passwordsMatch}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group">
              {loading
                ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating Account...</span></>
                : <><span>Create CareSync Account</span><ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">Sign In</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
