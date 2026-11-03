'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { Users, Mail, CalendarDays } from 'lucide-react'

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<any[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    Promise.all([
      apiClient.get('/appointments/doctor'),
      apiClient.get('/appointments/doctor/history'),
    ]).then(([a, h]) => {
      const all = [...(a.data || []), ...(h.data || [])]
      const map = new Map<string, any>()
      all.forEach(appt => {
        const p = appt.patientId
        if (p?._id && !map.has(p._id)) {
          map.set(p._id, { ...p, lastVisit: appt.date, totalVisits: 0 })
        }
        if (p?._id) map.get(p._id).totalVisits++
      })
      setPatients(Array.from(map.values()))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const initials = (name: string) => (name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <DoctorSidebar>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">My Patients</h2>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-400 w-56" />
        </div>
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No patients found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {initials(p.name)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11} />{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span className="flex items-center gap-1"><CalendarDays size={12} /> Last: {p.lastVisit}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {p.totalVisits} visit{p.totalVisits !== 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorSidebar>
  )
}
