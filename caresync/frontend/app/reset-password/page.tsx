'use client'
import { useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react'
import apiClient from '@/lib/api'

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'At least one special character (!@#$%^&*)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
]

function getStrength(password: string) {
  const passed = PASSWORD_RULES.filter(r => r.test(password)).length
  if (passed <= 1) return { label: 'Very Weak', color: 'bg-red-500', width: 'w-1/5' }
  if (passed === 2) return { label: 'Weak', color: 'bg-orange-400', width: 'w-2/5' }
  if (passed === 3) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-3/5' }
  if (passed === 4) return { label: 'Strong', color: 'bg-blue-500', width: 'w-4/5' }
  return { label: 'Very Strong', color: 'bg-green-500', width: 'w-full' }
}

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email') ?? ''
  const otp = params.get('otp') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getStrength(newPassword), [newPassword])
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(newPassword))
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRulesPassed) return setError('Password does not meet the requirements.')
    if (!passwordsMatch) return setError('Passwords do not match.')
    setLoading(true); setError('')
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Reset failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Password Reset!</h2>
        <p className="text-gray-500 text-sm mt-2">Your password has been updated successfully. Redirecting to login...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
        <p className="text-gray-500 text-sm mb-6">Create a strong password for <span className="text-indigo-600 font-medium">{email}</span></p>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleReset} className="space-y-3">
          {/* New Password */}
          <div className="relative">
            <input type={showNew ? 'text' : 'password'} placeholder="New Password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-gray-900 outline-none focus:border-indigo-400" />
            <button type="button" onClick={() => setShowNew(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Strength bar + rules */}
          {newPassword.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Password strength</span>
                <span className={`font-semibold ${strength.label === 'Very Strong' ? 'text-green-600' : strength.label === 'Strong' ? 'text-blue-600' : 'text-orange-500'}`}>
                  {strength.label}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`} />
              </div>
              <div className="space-y-1 pt-1">
                {PASSWORD_RULES.map(rule => {
                  const passed = rule.test(newPassword)
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {passed ? <Check size={13} className="text-green-500 shrink-0" /> : <X size={13} className="text-gray-300 shrink-0" />}
                      <span className={`text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required
              className={`w-full border rounded-2xl px-4 py-3 pr-12 text-gray-900 outline-none transition ${
                confirmPassword.length > 0
                  ? passwordsMatch ? 'border-green-400' : 'border-red-400'
                  : 'border-gray-200 focus:border-indigo-400'
              }`} />
            <button type="button" onClick={() => setShowConfirm(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <p className={`text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          <button type="submit" disabled={loading || !allRulesPassed || !passwordsMatch}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          <Link href="/login" className="text-indigo-600 font-semibold">← Back to Login</Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordForm /></Suspense>
}
