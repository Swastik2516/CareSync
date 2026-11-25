'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { Users, Mail, CalendarDays, FileText, FileImage, ExternalLink, X, FolderOpen } from 'lucide-react'

export default function DoctorPatientsPage() {
  const router = useRouter()
  const [patients, setPatients]         = useState<any[]>([])
  const [search, setSearch]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [reports, setReports]           = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState('')

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

  const openRecords = async (patient: any) => {
    setSelectedPatient(patient)
    setReports([])
    setReportsError('')
    setReportsLoading(true)
    try {
      const res = await apiClient.get(`/appointments/patient/${patient._id}/reports`)
      setReports(res.data || [])
    } catch (err: any) {
      setReportsError(err.response?.data?.error ?? 'Could not load records')
    } finally {
      setReportsLoading(false)
    }
  }

  const openFile = async (reportId: string) => {
    try {
      const res = await apiClient.get(`/reports/${reportId}/download`)
      if (res.data?.fileUrl) window.open(res.data.fileUrl, '_blank')
    } catch (err: any) {
      setReportsError(err.response?.data?.error ?? 'Could not open file')
    }
  }

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
                <button
                  onClick={() => openRecords(p)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl py-2 transition"
                >
                  <FolderOpen size={13} /> View Health Records
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Records Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Health Records</h3>
                <p className="text-xs text-gray-400">Shared by {selectedPatient.name}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {reportsLoading && <p className="text-center text-gray-400 py-10">Loading...</p>}
              {reportsError && <p className="text-center text-red-500 text-sm py-6">{reportsError}</p>}
              {!reportsLoading && !reportsError && reports.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">No records shared with you by this patient.</p>
              )}
              {reports.map(report => (
                <div key={report._id} className="border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-xl shrink-0">
                        {report.fileType?.startsWith('image/') ? <FileImage size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{report.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(report.uploadedAt).toLocaleDateString()}</p>
                        {report.healthCondition && (
                          <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Condition:</span> {report.healthCondition}</p>
                        )}
                        {report.prescribedTablets && (
                          <p className="text-xs text-gray-600 mt-0.5"><span className="font-semibold">Tablets:</span> {report.prescribedTablets}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openFile(report._id)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition shrink-0"
                    >
                      <ExternalLink size={12} /> Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DoctorSidebar>
  )
}
