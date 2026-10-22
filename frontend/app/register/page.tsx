'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Check, X } from 'lucide-react'
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

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', dateOfBirth: '1990-01-01', gender: 'Male', specialization: '', hospital: '', experience: '', consultationFee: '', bio: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const strength = useMemo(() => getStrength(form.password), [form.password])
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(form.password))
  const passwordsMatch = form.password === confirmPassword && confirmPassword.length > 0

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRulesPassed) return setError('Password does not meet the requirements.')
    if (form.password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    try {
      const payload: any = { ...form, role }
      if (role === 'DOCTOR') { payload.experience = Number(form.experience); payload.consultationFee = Number(form.consultationFee) }
      const { data } = await apiClient.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('name', data.name)
      router.push(data.role === 'DOCTOR' ? '/doctor/appointments' : '/patient/doctors')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600">CareSync</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

        {/* Role Toggle */}
        <div className="flex bg-gray-100 rounded-2xl p-1 mb-5">
          {(['PATIENT', 'DOCTOR'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} type="button"
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${role === r ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}>
              {r}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          {/* Basic fields */}
          {[['Full Name', 'name', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel']].map(([label, key, type]) => (
            <input key={key} type={type} placeholder={label} value={(form as any)[key]} onChange={set(key)} required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400" />
          ))}

          {/* Password field with eye icon */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={set('password')}
              required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 text-gray-900 outline-none focus:border-indigo-400"
            />
            <button type="button" onClick={() => setShowPassword(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength bar */}
          {form.password.length > 0 && (
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
              {/* Rules checklist */}
              <div className="space-y-1 pt-1">
                {PASSWORD_RULES.map(rule => {
                  const passed = rule.test(form.password)
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {passed
                        ? <Check size={13} className="text-green-500 shrink-0" />
                        : <X size={13} className="text-gray-300 shrink-0" />}
                      <span className={`text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}>{rule.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Confirm Password field with eye icon */}
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className={`w-full border rounded-2xl px-4 py-3 pr-12 text-gray-900 outline-none transition ${
                confirmPassword.length > 0
                  ? passwordsMatch ? 'border-green-400 focus:border-green-400' : 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-indigo-400'
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <p className={`text-xs -mt-1 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          {/* Patient fields */}
          {role === 'PATIENT' && <>
            <input type="text" placeholder="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChange={set('dateOfBirth')}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400" />
            <select value={form.gender} onChange={set('gender')}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </>}

          {/* Doctor fields */}
          {role === 'DOCTOR' && <>
            {[['Specialization', 'specialization', 'text'], ['Hospital', 'hospital', 'text'], ['Experience (years)', 'experience', 'number'], ['Consultation Fee ($)', 'consultationFee', 'number']].map(([label, key, type]) => (
              <input key={key} type={type} placeholder={label} value={(form as any)[key]} onChange={set(key)} required
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400" />
            ))}
            <textarea placeholder="Bio" value={form.bio} onChange={set('bio')} required rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 outline-none focus:border-indigo-400 resize-none" />
          </>}

          <button type="submit" disabled={loading || !allRulesPassed || !passwordsMatch}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 font-semibold">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
