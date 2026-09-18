'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { Search, Star, ShieldCheck } from 'lucide-react'

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    apiClient.get('/doctors').then(r => setDoctors(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = doctors.filter(d =>
    d.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Find Your Specialist</h1>
        <p className="text-gray-500 mt-1 mb-6">Healthcare, perfectly in sync.</p>

        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 gap-3">
          <Search size={18} className="text-gray-400" />
          <input placeholder="Search doctor, specialty..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm text-gray-900 outline-none" />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading doctors...</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((doc: any) => (
              <div key={doc._id} onClick={() => router.push(`/patient/doctors/${doc.userId._id}`)}
                className="bg-white border border-gray-100 rounded-3xl p-5 flex gap-4 cursor-pointer hover:shadow-md transition">
                <img src={doc.profileImage} alt={doc.userId?.name} className="w-20 h-20 rounded-2xl object-cover bg-gray-100" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{doc.userId?.name}</span>
                    <ShieldCheck size={16} className="text-indigo-600" />
                  </div>
                  <p className="text-indigo-600 text-sm font-medium mt-0.5">{doc.specialization}</p>
                  <p className="text-gray-400 text-xs mt-1">{doc.hospital} • {doc.experience} yrs exp</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-gray-700">{doc.rating}</span>
                    </div>
                    <span className="font-bold text-indigo-900">${doc.consultationFee}</span>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-gray-400 py-10">No doctors found.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
