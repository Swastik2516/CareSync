'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { RefreshCw, Calendar, Clock, X, CheckCircle2, AlertCircle } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 border border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-600 border border-red-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border border-blue-200',
  RESCHEDULED: 'bg-purple-100 text-purple-700 border border-purple-200',
  MISSED: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
}

function AppointmentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rescheduleId = searchParams.get('reschedule')

  const [activeAppointments, setActiveAppointments]   = useState<any[]>([])
  const [historyAppointments, setHistoryAppointments] = useState<any[]>([])
  const [activeTab, setActiveTab]                     = useState<'ACTIVE' | 'HISTORY'>('ACTIVE')
  const [loading, setLoading]                         = useState(true)

  // ── Reschedule Modal State ───────────────────────────────────────────────
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null)
  const [rescheduleDate, setRescheduleDate]     = useState(new Date().toISOString().split('T')[0])
  const [rescheduleSlots, setRescheduleSlots]   = useState<any[]>([])
  const [selectedSlot, setSelectedSlot]         = useState<string | null>(null)
  const [rescheduling, setRescheduling]         = useState(false)
  const [modalMsg, setModalMsg]                 = useState('')

  const fetchAllAppointments = async () => {
    setLoading(true)
    try {
      const [actRes, histRes] = await Promise.all([
        apiClient.get('/appointments/my'),
        apiClient.get('/appointments/history'),
      ])
      setActiveAppointments(actRes.data || [])
      setHistoryAppointments(histRes.data || [])

      // Auto-open reschedule modal if URL param exists
      if (rescheduleId) {
        const all = [...(actRes.data || []), ...(histRes.data || [])]
        const target = all.find(a => a._id === rescheduleId || a.appointmentId === rescheduleId)
        if (target) {
          openRescheduleModal(target)
        }
      }
    } catch (err) {
      console.error('Failed to load appointments', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchAllAppointments()
  }, [rescheduleId])

  // Fetch available slots whenever reschedule date changes
  useEffect(() => {
    if (!rescheduleTarget) return
    const docId = rescheduleTarget.doctorId?._id || rescheduleTarget.doctorId
    if (!docId) return

    apiClient.get(`/doctors/availability?doctorId=${docId}&date=${rescheduleDate}`)
      .then(r => setRescheduleSlots(r.data || []))
      .catch(() => setRescheduleSlots([]))
    setSelectedSlot(null)
  }, [rescheduleDate, rescheduleTarget])

  const openRescheduleModal = (appointment: any) => {
    setRescheduleTarget(appointment)
    setRescheduleDate(new Date().toISOString().split('T')[0])
    setSelectedSlot(null)
    setModalMsg('')
  }

  const handleConfirmReschedule = async () => {
    if (!selectedSlot || !rescheduleTarget) return
    setRescheduling(true)
    setModalMsg('')
    try {
      await apiClient.patch(`/appointments/${rescheduleTarget._id}/reschedule`, {
        newDate: rescheduleDate,
        newTimeSlot: selectedSlot,
      })
      setModalMsg('✅ Appointment rescheduled successfully!')
      setTimeout(() => {
        setRescheduleTarget(null)
        fetchAllAppointments()
      }, 1500)
    } catch (err: any) {
      setModalMsg(`❌ ${err.response?.data?.message ?? err.response?.data?.error ?? 'Reschedule failed'}`)
    } finally {
      setRescheduling(false)
    }
  }

  const displayList = activeTab === 'ACTIVE' ? activeAppointments : historyAppointments

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <div className="flex bg-gray-200/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({activeAppointments.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              History ({historyAppointments.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading appointments...</div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {activeTab === 'ACTIVE' ? 'No active upcoming appointments.' : 'No appointment history.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayList.map((a: any) => (
              <div key={a._id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{a.doctorId?.name ?? 'Doctor'}</p>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                      <Calendar size={14} className="text-indigo-500" /> {a.date}
                      <Clock size={14} className="text-indigo-500 ml-2" /> {a.timeSlot}
                    </p>
                    <p className="text-gray-600 text-sm mt-2"><span className="font-medium">Reason:</span> {a.reason}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {a.status === 'MISSED' ? '⚠️ MISSED (Time Passed)' : a.status}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Ref: {a.appointmentId}</p>

                  {(a.status === 'MISSED' || a.status === 'CANCELLED' || a.status === 'CONFIRMED' || a.status === 'PENDING') && (
                    <button
                      onClick={() => openRescheduleModal(a)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold px-4 py-2 rounded-xl transition"
                    >
                      <RefreshCw size={13} />
                      Reschedule Appointment
                    </button>
                  )}
                </div>

                {(a.treatment || a.medicines?.length || a.precautions || a.notes) && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-sm text-gray-600 bg-slate-50 p-4 rounded-2xl">
                    <p className="font-bold text-gray-900">Doctor's Guidance & Treatment</p>
                    {a.treatment && <p><span className="font-semibold text-gray-800">Treatment:</span> {a.treatment}</p>}
                    {a.medicines?.length > 0 && (
                      <p><span className="font-semibold text-gray-800">Tablets:</span> {a.medicines.map((m: any) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.duration ? ` for ${m.duration}` : ''}`).join(', ')}</p>
                    )}
                    {a.precautions && <p><span className="font-semibold text-gray-800">Precautions:</span> {a.precautions}</p>}
                    {a.notes && <p><span className="font-semibold text-gray-800">Notes:</span> {a.notes}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setRescheduleTarget(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <RefreshCw size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reschedule Appointment</h2>
                <p className="text-xs text-gray-500">Dr. {rescheduleTarget.doctorId?.name ?? 'Doctor'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700">Select New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Available Time Slots</label>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-3 rounded-xl">
                    No doctor slots available for this date.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto p-1">
                    {rescheduleSlots.map((slot: any) => {
                      const isFull = slot.bookedCount >= 10
                      const isSelected = selectedSlot === slot.time
                      return (
                        <button
                          key={slot.time}
                          disabled={isFull}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition ${
                            isFull
                              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400'
                          }`}
                        >
                          {slot.time}
                          <span className={`block text-[10px] ${isFull ? 'text-red-400 font-bold' : isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {isFull ? 'Full' : `${slot.bookedCount}/10`}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {modalMsg && (
                <div
                  className={`text-xs px-4 py-3 rounded-xl ${
                    modalMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {modalMsg}
                </div>
              )}

              <button
                onClick={handleConfirmReschedule}
                disabled={!selectedSlot || rescheduling}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-md mt-2"
              >
                {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <AppointmentsContent />
    </Suspense>
  )
}
