'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PatientSidebar from '@/components/PatientSidebar'
import apiClient from '@/lib/api'
import {
  CalendarDays, Stethoscope, FileText, User, Clock,
  ArrowRight, ShieldCheck, HeartPulse, Activity,
  CheckCircle2, AlertCircle, Plus, Sparkles, ExternalLink,
  ChevronRight, Calendar, CreditCard, Award
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  CONFIRMED: { label: 'Confirmed', badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  PENDING:   { label: 'Pending Approval', badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  COMPLETED: { label: 'Completed', badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  MISSED:    { label: 'Missed', badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  RESCHEDULED: { label: 'Rescheduled', badge: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
}

export default function PatientDashboard() {
  const router = useRouter()
  const [activeAppointments, setActiveAppointments]   = useState<any[]>([])
  const [historyAppointments, setHistoryAppointments] = useState<any[]>([])
  const [reports, setReports]                         = useState<any[]>([])
  const [loading, setLoading]                         = useState(true)
  const [patientName, setPatientName]                 = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setPatientName(localStorage.getItem('name') || 'Patient')

    Promise.all([
      apiClient.get('/appointments/my').catch(() => ({ data: [] })),
      apiClient.get('/appointments/history').catch(() => ({ data: [] })),
      apiClient.get('/reports').catch(() => ({ data: [] })),
    ])
      .then(([actRes, histRes, repRes]) => {
        setActiveAppointments(actRes.data || [])
        setHistoryAppointments(histRes.data || [])
        setReports(repRes.data || [])
      })
      .finally(() => setLoading(false))
  }, [router])

  const allAppointments = useMemo(() => {
    return [...activeAppointments, ...historyAppointments]
  }, [activeAppointments, historyAppointments])

  const nextAppointment = useMemo(() => {
    if (activeAppointments.length === 0) return null
    // Sort by date and time slot
    return [...activeAppointments].sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      if (cmp !== 0) return cmp
      return (a.timeSlot || '').localeCompare(b.timeSlot || '')
    })[0]
  }, [activeAppointments])

  const uniqueDoctors = useMemo(() => {
    return new Set(allAppointments.map(a => a.doctorId?._id || a.doctorId).filter(Boolean)).size
  }, [allAppointments])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <PatientSidebar>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Synchronizing health dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-7xl mx-auto">
          
          {/* Welcome Banner */}
          <div className="relative bg-gradient-to-r from-slate-900 via-[#0e1d37] to-indigo-950 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-800">
            <div className="absolute right-[-40px] top-[-40px] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-[20%] bottom-[-50px] w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Patient Account Active • Encrypted Vault
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {greeting}, {patientName}
                </h1>
                <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
                  Welcome to your personal health portal. Manage your consultations, review past clinical notes, and access your digital medical records securely.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/patient/doctors"
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 group"
                >
                  <Stethoscope size={15} />
                  <span>Book a Specialist</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/patient/health-records"
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>Upload Record</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Clock size={22} />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  Upcoming
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Active Bookings</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{activeAppointments.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {nextAppointment ? `Next on ${nextAppointment.date}` : 'No upcoming visits'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={22} />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  History
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Total Visits</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{allAppointments.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {historyAppointments.length} past consultations
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText size={22} />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Encrypted
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Health Records</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{reports.length}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Lab scans & prescriptions</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Stethoscope size={22} />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  Network
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Doctors Consulted</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{uniqueDoctors}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Verified specialists</p>
            </div>
          </div>

          {/* Biometrics & Telemetry Health Status Strip */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <HeartPulse size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Heart Rate</p>
                <p className="text-sm font-extrabold text-slate-800">72 bpm <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full ml-1">Normal</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</p>
                <p className="text-sm font-extrabold text-slate-800">120/80 <span className="text-[10px] text-slate-400 font-normal">mmHg</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medical Records</p>
                <p className="text-sm font-extrabold text-slate-800">Encrypted <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full ml-1">HIPAA</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telemetry Sync</p>
                <p className="text-sm font-extrabold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Active
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid: Spotlight & Quick Services */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Next Consultation Spotlight + Recent History (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Next Scheduled Consultation Spotlight */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Next Scheduled Consultation</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Your closest upcoming clinical appointment</p>
                  </div>
                  <Link
                    href="/patient/appointments"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight size={13} />
                  </Link>
                </div>

                {nextAppointment ? (
                  <div className="mt-5 p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-slate-50 to-blue-50/40 border border-indigo-100/80 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-sm">
                          <Stethoscope size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                              {nextAppointment.doctorId?.name?.startsWith('Dr.')
                                ? nextAppointment.doctorId.name
                                : `Dr. ${nextAppointment.doctorId?.name || 'Practitioner'}`}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CONFIG[nextAppointment.status]?.badge || 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_CONFIG[nextAppointment.status]?.label || nextAppointment.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {nextAppointment.reason || 'General Consultation'}
                          </p>
                        </div>
                      </div>

                      {/* Date & Time Slot */}
                      <div className="text-left sm:text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-2xs">
                          <Clock size={13} className="text-indigo-600" />
                          <span>{nextAppointment.timeSlot}</span>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          📅 {nextAppointment.date}
                        </p>
                      </div>

                    </div>

                    {/* Bottom Actions inside the card */}
                    <div className="mt-4 pt-4 border-t border-indigo-100/60 flex items-center justify-between text-xs">
                      <span className={`font-semibold px-2 py-0.5 rounded-md ${
                        nextAppointment.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {nextAppointment.paymentStatus === 'PAID' ? '✓ Consultation Fee Paid' : '⏳ Payment Pending'}
                      </span>
                      
                      <Link
                        href="/patient/appointments"
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        Manage Slot <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
                      <Calendar size={28} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No upcoming appointments</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      You do not have any pending appointments. Need clinical advice? Book an appointment with a verified practitioner.
                    </p>
                    <Link
                      href="/patient/doctors"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition shadow-sm"
                    >
                      <Stethoscope size={14} />
                      <span>Find a Doctor</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Recent Consultation History */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Consultations</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Past medical visits and recorded notes</p>
                  </div>
                  <Link
                    href="/patient/appointments"
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    All History
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {historyAppointments.slice(0, 3).map((a: any) => {
                    const docName = a.doctorId?.name || 'Doctor'
                    const cfg = STATUS_CONFIG[a.status] || { label: a.status, badge: 'bg-slate-100 text-slate-600' }
                    return (
                      <div key={a._id} className="py-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {docName.startsWith('Dr.') ? docName : `Dr. ${docName}`}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {a.reason || 'General Consultation'} • {a.date} at {a.timeSlot}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                  {historyAppointments.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No previous consultation history found.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Right: Quick Patient Services & Health Vault (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Quick Services Grid */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Healthcare Services</h3>
                <p className="text-xs text-slate-400 mb-4">Quick access to essential patient tools</p>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/patient/doctors"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Find Doctors</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Schedule new visit</p>
                    </div>
                  </Link>

                  <Link
                    href="/patient/appointments"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Appointments</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Reschedule or view</p>
                    </div>
                  </Link>

                  <Link
                    href="/patient/health-records"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">Health Vault</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Scans & reports</p>
                    </div>
                  </Link>

                  <Link
                    href="/patient/profile"
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-100 hover:border-indigo-200 transition group flex flex-col justify-between"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">My Profile</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Personal details</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Digital Health Records Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Health Vault</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{reports.length} records securely archived</p>
                  </div>
                  <Link
                    href="/patient/health-records"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Vault <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 mt-2">
                  {reports.slice(0, 3).map((r: any) => (
                    <div key={r._id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{r.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {r.healthCondition || 'General Record'} • {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Archived'}
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/patient/health-records"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No medical files uploaded yet.
                    </p>
                  )}
                </div>
              </div>

              {/* CareSync Trust Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">CareSync Patient Security</h4>
                    <p className="text-[11px] text-slate-400">HIPAA Compliant & Encrypted</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your consultations, health notes, and uploaded diagnostic files are strictly confidential and shared only with your treating physicians.
                </p>
              </div>

            </div>

          </div>

        </div>
      )}
    </PatientSidebar>
  )
}

