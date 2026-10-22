'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { CalendarDays, FileText, Save, Users, CheckCircle, Clock, DollarSign, AlertCircle, X, CreditCard } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700 border border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-600 border border-red-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border border-blue-200',
  RESCHEDULED: 'bg-purple-100 text-purple-700 border border-purple-200',
  MISSED: 'bg-amber-100 text-amber-800 border border-amber-300',
}

export default function DoctorAppointmentsPage() {
  const router = useRouter()
  const [activeAppointments, setActiveAppointments]   = useState<any[]>([])
  const [historyAppointments, setHistoryAppointments] = useState<any[]>([])
  const [activeTab, setActiveTab]                     = useState<'ACTIVE' | 'HISTORY'>('ACTIVE')
  const [loading, setLoading]                         = useState(true)

  const [selectedPatient, setSelectedPatient]   = useState<string | null>(null)
  const [reports, setReports]                   = useState<any[]>([])
  const [reportFiles, setReportFiles]           = useState<Record<string, any>>({})
  const [drafts, setDrafts]                     = useState<Record<string, any>>({})
  const [savingTreatment, setSavingTreatment]   = useState<string | null>(null)

  // Early Completion Modal State
  const [earlyCompleteAppt, setEarlyCompleteAppt] = useState<any>(null)
  const [earlyReason, setEarlyReason]             = useState('')
  const [earlySubmitting, setEarlySubmitting]     = useState(false)
  const [earlyError, setEarlyError]               = useState('')

  const fetchAllAppointments = async () => {
    setLoading(true)
    try {
      const [actRes, histRes] = await Promise.all([
        apiClient.get('/appointments/doctor'),
        apiClient.get('/appointments/doctor/history'),
      ])
      setActiveAppointments(actRes.data || [])
      setHistoryAppointments(histRes.data || [])
    } catch (err) {
      console.error('Failed to load appointments', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    fetchAllAppointments()
  }, [])

  const handleMarkComplete = (appointment: any) => {
    const todayStr = new Date().toISOString().split('T')[0]
    if (appointment.date > todayStr) {
      // Future appointment being completed early
      setEarlyCompleteAppt(appointment)
      setEarlyReason('')
      setEarlyError('')
    } else {
      updateStatus(appointment._id, 'COMPLETED')
    }
  }

  const submitEarlyComplete = async () => {
    if (!earlyReason.trim()) {
      setEarlyError('Please provide a reason for early completion (e.g., patient visited early).')
      return
    }
    setEarlySubmitting(true)
    setEarlyError('')
    try {
      await apiClient.patch(`/appointments/${earlyCompleteAppt._id}/status`, {
        status: 'COMPLETED',
        earlyReason: earlyReason.trim()
      })
      setEarlyCompleteAppt(null)
      fetchAllAppointments()
    } catch (err: any) {
      setEarlyError(err.response?.data?.error ?? 'Early completion failed')
    } finally {
      setEarlySubmitting(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/appointments/${id}/status`, { status })
      fetchAllAppointments()
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Update failed')
    }
  }

  const markPaymentPaid = async (id: string) => {
    try {
      await apiClient.patch(`/appointments/${id}/payment-status`)
      fetchAllAppointments()
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to update payment status')
    }
  }

  const openPatientRecords = async (appointment: any) => {
    if (selectedPatient === appointment.patientId?._id) {
      setSelectedPatient(null)
      return
    }
    setSelectedPatient(appointment.patientId?._id)
    const current = drafts[appointment._id] ?? {
      treatment: appointment.treatment ?? '',
      medicines: appointment.medicines?.map((medicine: any) => `${medicine.name} | ${medicine.dosage} | ${medicine.duration}`).join('\n') ?? '',
      notes: appointment.notes ?? '',
      precautions: appointment.precautions ?? '',
    }
    setDrafts(previous => ({ ...previous, [appointment._id]: current }))
    try {
      const response = await apiClient.get(`/appointments/patient/${appointment.patientId?._id}/reports`)
      setReports(response.data)
    } catch (error: any) {
      alert(error.response?.data?.error ?? 'Could not load patient records')
    }
  }

  const viewReport = async (report: any, patientId: string) => {
    if (reportFiles[report._id]) {
      window.open(reportFiles[report._id].fileData, '_blank')
      return
    }
    try {
      const response = await apiClient.get(`/appointments/patient/${patientId}/reports/${report._id}/file`)
      setReportFiles(previous => ({ ...previous, [report._id]: response.data }))
      window.open(response.data.fileData, '_blank')
    } catch (error: any) {
      alert(error.response?.data?.error ?? 'Could not open report')
    }
  }

  const saveTreatment = async (appointmentId: string) => {
    const draft = drafts[appointmentId]
    const medicines = draft.medicines.split('\n').map((line: string) => line.trim()).filter(Boolean).map((line: string) => {
      const [name = '', dosage = '', duration = ''] = line.split('|').map((part: string) => part.trim())
      return { name, dosage, duration }
    })
    setSavingTreatment(appointmentId)
    try {
      await apiClient.patch(`/appointments/${appointmentId}/treatment`, { ...draft, medicines })
      alert('Treatment saved successfully!')
      fetchAllAppointments()
    } catch (error: any) {
      alert(error.response?.data?.error ?? 'Could not save treatment')
    } finally {
      setSavingTreatment(null)
    }
  }

  const patientsTreatedCount = historyAppointments.filter(a => a.status === 'COMPLETED').length
  const totalRevenue = [...activeAppointments, ...historyAppointments]
    .filter(a => a.paymentStatus === 'PAID')
    .reduce((sum, a) => sum + (a.amount || 0), 0)

  const displayList = activeTab === 'ACTIVE' ? activeAppointments : historyAppointments

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Doctor Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patients Treated</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{patientsTreatedCount}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Appointments</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{activeAppointments.length}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenue Collected</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">₹{totalRevenue}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patient Appointments</h1>
          <div className="flex bg-gray-200/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'ACTIVE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active ({activeAppointments.length})
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
            {activeTab === 'ACTIVE' ? 'No active appointments scheduled.' : 'No appointment history found.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {displayList.map((a: any) => (
              <div key={a._id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{a.patientId?.name ?? 'Patient'}</p>
                    <p className="text-xs text-gray-400">{a.patientId?.email}</p>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                      <CalendarDays size={14} className="text-indigo-500" /> {a.date}
                      <Clock size={14} className="text-indigo-500 ml-2" /> {a.timeSlot}
                    </p>
                    <p className="text-gray-600 text-sm mt-2"><span className="font-medium">Reason:</span> {a.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLES[a.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {a.status}
                    </span>
                    {/* Payment Status Badge */}
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                      a.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      <CreditCard size={12} />
                      {a.paymentStatus === 'PAID' ? 'PAID' : 'PAYMENT PENDING'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Ref: {a.appointmentId}</p>

                  <div className="flex items-center gap-2">
                    {a.paymentStatus !== 'PAID' && (
                      <button
                        onClick={() => markPaymentPaid(a._id)}
                        className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
                      >
                        Mark Paid at Clinic
                      </button>
                    )}
                    <button
                      onClick={() => openPatientRecords(a)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                    >
                      {selectedPatient === a.patientId?._id ? 'Hide Records' : 'View Records & Add Treatment'}
                    </button>
                  </div>
                </div>

                {selectedPatient === a.patientId?._id && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-5 bg-slate-50 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm">Patient Medical Records</h3>
                      {reports.length === 0 ? (
                        <p className="text-xs text-gray-400">No records uploaded by patient yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {reports.map(report => (
                            <div key={report._id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                                    <FileText size={15} className="text-indigo-600" />
                                    {report.name}
                                  </p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <CalendarDays size={12} /> Uploaded {new Date(report.uploadedAt).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => viewReport(report, a.patientId?._id)}
                                  className="text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-3 py-1 rounded-lg"
                                >
                                  Open File
                                </button>
                              </div>
                              {report.healthCondition && <p className="text-xs text-gray-600 mt-2"><span className="font-semibold">Condition:</span> {report.healthCondition}</p>}
                              {report.prescribedTablets && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Patient Tablets:</span> {report.prescribedTablets}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm">Add Treatment & Guidance</h3>
                      <div className="space-y-3">
                        <textarea
                          value={drafts[a._id]?.treatment ?? ''}
                          onChange={event => setDrafts(previous => ({ ...previous, [a._id]: { ...previous[a._id], treatment: event.target.value } }))}
                          placeholder="Treatment / Diagnosis"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none bg-white outline-none focus:border-indigo-400"
                        />
                        <textarea
                          value={drafts[a._id]?.medicines ?? ''}
                          onChange={event => setDrafts(previous => ({ ...previous, [a._id]: { ...previous[a._id], medicines: event.target.value } }))}
                          placeholder="Tablets: one per line, e.g. Paracetamol | 500 mg | 3 days"
                          rows={3}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none bg-white outline-none focus:border-indigo-400"
                        />
                        <textarea
                          value={drafts[a._id]?.precautions ?? ''}
                          onChange={event => setDrafts(previous => ({ ...previous, [a._id]: { ...previous[a._id], precautions: event.target.value } }))}
                          placeholder="Precautions to be taken"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none bg-white outline-none focus:border-indigo-400"
                        />
                        <textarea
                          value={drafts[a._id]?.notes ?? ''}
                          onChange={event => setDrafts(previous => ({ ...previous, [a._id]: { ...previous[a._id], notes: event.target.value } }))}
                          placeholder="Additional Notes"
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none bg-white outline-none focus:border-indigo-400"
                        />
                        <button
                          onClick={() => saveTreatment(a._id)}
                          disabled={savingTreatment === a._id}
                          className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition shadow-sm"
                        >
                          <Save size={16} />
                          {savingTreatment === a._id ? 'Saving...' : 'Save Treatment'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {a.status === 'CONFIRMED' && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleMarkComplete(a)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => updateStatus(a._id, 'CANCELLED')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Early Completion Reason Modal */}
      {earlyCompleteAppt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setEarlyCompleteAppt(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Early Completion Reason</h2>
                <p className="text-xs text-gray-500">Scheduled Date: {earlyCompleteAppt.date}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              This appointment is scheduled for a future date (<strong>{earlyCompleteAppt.date}</strong>). If the patient visited early or was treated ahead of schedule, please enter a brief completion reason/note:
            </p>

            <textarea
              value={earlyReason}
              onChange={(e) => setEarlyReason(e.target.value)}
              placeholder="e.g. Patient visited clinic early, consultation completed today."
              rows={3}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none mb-4"
            />

            {earlyError && (
              <p className="text-xs bg-red-50 text-red-600 px-4 py-2.5 rounded-xl mb-4 border border-red-200">
                {earlyError}
              </p>
            )}

            <button
              onClick={submitEarlyComplete}
              disabled={earlySubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50 shadow-md"
            >
              {earlySubmitting ? 'Submitting...' : 'Confirm Early Completion'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
