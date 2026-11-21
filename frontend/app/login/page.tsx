'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles,
  AlertCircle, Stethoscope, User, ShieldCheck
} from 'lucide-react'
import Image from 'next/image'
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

          {/* KLE Hospital Logo */}
          <div className="relative mb-6 z-10 flex flex-col items-center">
            <Image src="/kle-logo.webp" alt="KLE Hospital" width={288} height={288} className="object-contain drop-shadow-2xl" priority />
            <p className="font-black text-center text-3xl mt-4 leading-tight tracking-wide bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text drop-shadow-lg">
              KLE's Dr. Prabhakar Kore Hospital &<br />Medical Research Centre
            </p>
          </div>
        </div>

        {/* Right Form Area (7 cols on lg) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-slate-900/90">
          
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <Image src="/kle-logo.webp" alt="KLE Hospital" width={40} height={40} className="object-contain" />
            <div>
              <h2 className="text-sm font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text leading-tight">
                KLE's Dr. Prabhakar Kore Hospital &<br />Medical Research Centre
              </h2>
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
