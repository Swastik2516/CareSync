'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, KeyRound } from 'lucide-react'
import apiClient from '@/lib/api'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    try {
      await apiClient.post('/auth/forgot-password', { email })
      setMsg('OTP sent to your email. Check your inbox.')
      setStep('otp')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setMsg('')
    try {
      await apiClient.post('/auth/verify-otp', { email, otp })
      router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid or expired OTP')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 'email' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
          <div className={`flex-1 h-1 rounded-full ${step === 'otp' ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === 'otp' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
        </div>

        {step === 'email' ? (
          <>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="text-indigo-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
            </div>
            <p className="text-gray-500 text-sm mb-6">Enter your registered email and we'll send you a 6-digit OTP.</p>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
            {msg && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">{msg}</div>}

            <form onSubmit={handleSendOTP} className="space-y-4">
              <input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400" />
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition">
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <KeyRound className="text-indigo-600" size={24} />
              <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
            </div>
            <p className="text-gray-500 text-sm mb-1">A 6-digit OTP was sent to</p>
            <p className="text-indigo-600 font-semibold text-sm mb-6">{email}</p>

            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input
                type="text" placeholder="Enter 6-digit OTP" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6} required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 text-center text-2xl font-bold tracking-widest outline-none focus:border-indigo-400"
              />
              <p className="text-xs text-gray-400 text-center">OTP expires in 5 minutes</p>
              <button type="submit" disabled={loading || otp.length !== 6}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <button onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="w-full text-center text-sm text-gray-500 hover:text-indigo-600 mt-3 transition">
              ← Resend OTP
            </button>
          </>
        )}

        <p className="text-center text-gray-500 text-sm mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
