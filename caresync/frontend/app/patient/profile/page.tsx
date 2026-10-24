'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { Trash2, X } from 'lucide-react'

export default function PatientProfilePage() {
  const router = useRouter()
  const [name, setName]               = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [message, setMessage]         = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    setName(localStorage.getItem('name') ?? '')
  }, [])

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

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</p>
            <p className="text-gray-900 font-semibold mt-1">{name}</p>
          </div>

          {message && (
            <p className="text-xs px-4 py-3 rounded-xl bg-red-50 text-red-600">{message}</p>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-2xl border border-red-200 transition"
            >
              <Trash2 size={16} />
              Delete My Account
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              This will permanently delete your account, appointments and all health records.
            </p>
          </div>
        </div>
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
              Are you sure you want to delete your account? All your appointments and health records will be permanently removed.
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
