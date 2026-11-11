'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles,
  AlertCircle, Stethoscope, User, ShieldCheck
} from 'lucide-react'
import apiClient from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePreset, setActivePreset] = useState<'doctor' | 'patient' | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      router.push(data.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'doctor' | 'patient') => {
    setActivePreset(role)
    setError('')
    if (role === 'doctor') {
      setEmail('doctor@example.com')
      setPassword('Doctor@123')
    } else {
      setEmail('patient@example.com')
      setPassword('Patient@123')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Dynamic Background Light Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* Left Side: Healthcare Logo & Brand Emblem Only */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-center items-center text-center p-12 bg-gradient-to-br from-slate-900 via-[#0a182f] to-indigo-950/80 border-r border-slate-800/60 relative overflow-hidden">
          {/* Subtle Grid Pattern Overlay */}
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
                {/* Medical Cross Base */}
                <path
                  d="M38 16C38 12.6863 40.6863 10 44 10H56C59.3137 10 62 12.6863 62 16V38H84C87.3137 38 90 40.6863 90 44V56C90 59.3137 87.3137 62 84 62H62V84C62 87.3137 59.3137 90 56 90H44C40.6863 90 38 87.3137 38 84V62H16C12.6863 62 10 59.3137 10 56V44C10 40.6863 12.6863 38 16 38H38V16Z"
                  fill="url(#cross-gradient)"
                  fillOpacity="0.25"
                  stroke="url(#cross-gradient)"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                {/* ECG Pulse Wave through the Center */}
                <path
                  d="M18 50H35L42 36L50 64L58 42L64 54L68 50H82"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="64" r="3" fill="#a5f3fc" />
                <defs>
                  <linearGradient id="cross-gradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
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
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-slate-900/90">
          
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
              <p className="text-xs text-slate-400">Sign in to your account</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Quick Demo Credentials Toolbar */}
          <div className="mb-6 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                Quick-Fill Demo Credentials
              </span>
              <span className="text-[10px] text-slate-400 font-medium">1-Click Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('doctor')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  activePreset === 'doctor'
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                }`}
              >
                <Stethoscope size={14} className="text-blue-400" />
                <span>Doctor Demo</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('patient')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  activePreset === 'patient'
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/70 text-slate-300'
                }`}
              >
                <User size={14} className="text-indigo-400" />
                <span>Patient Demo</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
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
                  value={email}
                  onChange={e => { setEmail(e.target.value); setActivePreset(null) }}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setActivePreset(null) }}
                  required
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-2xl pl-11 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account yet?{' '}
              <Link
                href="/register"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                Create Account
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}
