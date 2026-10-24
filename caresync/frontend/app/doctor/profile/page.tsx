'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { Save, Trash2, X } from 'lucide-react'

export default function DoctorProfilePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    specialization: '', hospital: '', experience: '', consultationFee: '', bio: '', profileImage: ''
  })
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [message, setMessage]         = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]       = useState(false)

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
            profileImage:    d.profileImage    ?? '',
          })
        })
        .catch(() => setMessage('Could not load profile'))
        .finally(() => setLoading(false))
    } catch {
      router.push('/login')
    }
  }, [])

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
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            {field('Specialization', 'specialization')}
            {field('Hospital / Clinic', 'hospital')}
            {field('Years of Experience', 'experience', 'number')}
            {field('Consultation Fee (₹)', 'consultationFee', 'number')}
            {field('Bio', 'bio', 'text', 3)}
            {field('Profile Image URL (optional)', 'profileImage')}

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
                This will permanently delete your account and all appointments. Doctor registration will be re-enabled.
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
              Are you sure you want to delete your doctor account? All your appointments and data will be permanently removed. Doctor registration will be re-enabled for a new doctor.
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
    </div>
  )
}
