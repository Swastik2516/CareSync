'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Check, X, Mail, Lock, User, Phone,
  Sparkles, ShieldCheck, Stethoscope,
  Building2, Award, DollarSign, Calendar, ArrowRight,
  AlertCircle
} from 'lucide-react'
import apiClient from '@/lib/api'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special symbol (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function getStrength(password: string) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  if (passed <= 1) return { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-400', width: 'w-1/5' }
  if (passed === 2) return { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-400', width: 'w-2/5' }
  if (passed === 3) return { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-400', width: 'w-3/5' }
  if (passed === 4) return { label: 'Strong', color: 'bg-blue-500', text: 'text-blue-400', width: 'w-4/5' }
  return { label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-400', width: 'w-full' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [doctorSlotOpen, setDoctorSlotOpen] = useState(false)
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    specialization: '',
    hospital: '',
    experience: '',
    consultationFee: '',
    bio: ''
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if doctor registration slot is available
  useEffect(() => {
    apiClient.get('/auth/doctor-slot')
      .then(res => setDoctorSlotOpen(res.data.open))
      .catch(() => setDoctorSlotOpen(false))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const strength = useMemo(() => getStrength(form.password), [form.password])
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(form.password))
  const passwordsMatch = form.password === confirmPassword && confirmPassword.length > 0

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRulesPassed) return setError('Please satisfy all password security requirements.')
    if (form.password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    try {
      const payload: any = { ...form, role }
      if (role === 'DOCTOR') {
        payload.experience = Number(form.experience)
        payload.consultationFee = Number(form.consultationFee)
      }
      const { data } = await apiClient.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      router.push(data.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background Ambience Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 my-8">
        
        {/* Left Side: Healthcare Logo & Branding Only */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center items-center text-center p-12 bg-gradient-to-br from-slate-900 via-[#0a182f] to-indigo-950/80 border-r border-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Glowing Healthcare Icon Container */}
          <div className="relative mb-8 group z-10">
            {/* Outer Glow Halo */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-teal-400 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-subtle" />
            
            {/* Logo Card */}
            <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-tr from-slate-900 via-[#0e213d] to-indigo-900 p-0.5 border border-indigo-500/40 shadow-2xl flex items-center justify-center">
              {/* Healthcare Cross & ECG Pulse SVG Logo */}
              <svg
                viewBox="0 0 100 100"
                className="w-20 h-20 text-indigo-400 drop-shadow-[0_0_16px_rgba(99,102,241,0.6)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M38 16C38 12.6863 40.6863 10 44 10H56C59.3137 10 62 12.6863 62 16V38H84C87.3137 38 90 40.6863 90 44V56C90 59.3137 87.3137 62 84 62H62V84C62 87.3137 59.3137 90 56 90H44C40.6863 90 38 87.3137 38 84V62H16C12.6863 62 10 59.3137 10 56V44C10 40.6863 12.6863 38 16 38H38V16Z"
                  fill="url(#cross-gradient-reg)"
                  fillOpacity="0.25"
                  stroke="url(#cross-gradient-reg)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 50H35L42 36L50 64L58 42L64 54L68 50H82"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="64" r="3" fill="#a5f3fc" />
                <defs>
                  <linearGradient id="cross-gradient-reg" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="0.5" stopColor="#6366f1" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Brand Title */}
          <div className="z-10">
            <h1 className="text-4xl font-black tracking-tight text-white">
              Care<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400">Sync</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
              Healthcare Platform
            </p>
          </div>
        </div>

        {/* Right Form Area (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-slate-900/90 overflow-y-auto max-h-[92vh]">
          
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg viewBox="0 0 100 100" className="w-6 h-6 text-white" fill="none">
                <path d="M38 16H62V38H84V62H62V84H38V62H16V38H38V16Z" stroke="white" strokeWidth="6" />
                <path d="M22 50H36L44 38L52 62L60 44L66 52H78" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Care<span className="text-indigo-400">Sync</span></h2>
              <p className="text-xs text-slate-400">Create an account</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              Select your role and enter your details to get started.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Segmented Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
              Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('PATIENT')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  role === 'PATIENT'
                    ? 'bg-gradient-to-r from-indigo-900/40 to-blue-900/30 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  role === 'PATIENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Patient</p>
                  <p className="text-[11px] text-slate-400">Book care & track records</p>
                </div>
              </button>

              {doctorSlotOpen ? (
                <button
                  type="button"
                  onClick={() => setRole('DOCTOR')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all relative ${
                    role === 'DOCTOR'
                      ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/30 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                      : 'bg-slate-800/40 border-slate-700/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    role === 'DOCTOR' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
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
              ) : (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-800/20 text-slate-500 cursor-not-allowed">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-600 shrink-0">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Doctor</p>
                    <p className="text-[11px] text-slate-600">Slots full at capacity</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Section 1: Basic Information */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={set('name')}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={set('email')}
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={set('phone')}
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Password Security */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {form.password.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Password Security Strength</span>
                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  {/* Rule Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {PASSWORD_RULES.map(rule => {
                      const passed = rule.test(form.password)
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {passed ? (
                            <Check size={13} className="text-emerald-400 shrink-0" />
                          ) : (
                            <X size={13} className="text-slate-600 shrink-0" />
                          )}
                          <span className={`text-[11px] ${passed ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                            {rule.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className={`w-full bg-slate-800/60 border rounded-2xl pl-11 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          : 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passwordsMatch ? (
                      <>
                        <Check size={13} /> Passwords match
                      </>
                    ) : (
                      <>
                        <X size={13} /> Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Role-Specific Details */}
            {role === 'PATIENT' && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={form.dateOfBirth}
                      onChange={set('dateOfBirth')}
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={set('gender')}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Male" className="bg-slate-900 text-white">Male</option>
                    <option value="Female" className="bg-slate-900 text-white">Female</option>
                    <option value="Other" className="bg-slate-900 text-white">Other</option>
                  </select>
                </div>
              </div>
            )}

            {role === 'DOCTOR' && (
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Award size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Cardiologist"
                        value={form.specialization}
                        onChange={set('specialization')}
                        required
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Hospital / Clinic
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Building2 size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. City General Hospital"
                        value={form.hospital}
                        onChange={set('hospital')}
                        required
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      min="0"
                      value={form.experience}
                      onChange={set('experience')}
                      required
                      className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Consultation Fee ($)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <DollarSign size={18} />
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 75"
                        min="0"
                        value={form.consultationFee}
                        onChange={set('consultationFee')}
                        required
                        className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Professional Bio
                  </label>
                  <textarea
                    placeholder="Brief background of clinical practice, education, and patient care philosophy..."
                    value={form.bio}
                    onChange={set('bio')}
                    required
                    rows={3}
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !allRulesPassed || !passwordsMatch}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create CareSync Account</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Sign In
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}
