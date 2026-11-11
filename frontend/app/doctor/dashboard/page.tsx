'use client'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import {
  CalendarDays, Users, Clock, CheckCircle2, ChevronLeft, ChevronRight,
  ArrowRight, Activity, Sparkles, TrendingUp, AlertCircle, Calendar,
  CreditCard, Check, X, Filter, Stethoscope, ShieldCheck, HeartPulse,
  User, ArrowUpRight
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; badge: string; border: string }> = {
  CONFIRMED: {
    label: 'Confirmed',
    color: '#3b82f6',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-blue-500'
  },
  PENDING: {
    label: 'Pending',
    color: '#f59e0b',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-amber-500'
  },
  COMPLETED: {
    label: 'Completed',
    color: '#10b981',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'border-emerald-500'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#ef4444',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'border-rose-500'
  },
  MISSED: {
    label: 'Missed',
    color: '#8b5cf6',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    border: 'border-purple-500'
  },
  RESCHEDULED: {
    label: 'Rescheduled',
    color: '#06b6d4',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'border-cyan-500'
  },
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  badgeText,
  gradient,
  accentColor
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  subtext: string
  badgeText?: string
  gradient: string
  accentColor: string
}) {
  return (
    <div className="relative bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Subtle background glow */}
      <div className={`absolute top-0 right-0 w-28 h-28 ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accentColor} shadow-sm`}>
          {icon}
        </div>
        {badgeText && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        </div>
        <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [active, setActive]     = useState<any[]>([])
  const [history, setHistory]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [doctorName, setDoctorName] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setDoctorName(localStorage.getItem('name') || 'Doctor')

    Promise.all([
      apiClient.get('/appointments/doctor'),
      apiClient.get('/appointments/doctor/history'),
    ])
      .then(([a, h]) => {
        setActive(a.data || [])
        setHistory(h.data || [])
      })
      .catch(err => {
        console.error('Failed to load dashboard appointments:', err)
      })
      .finally(() => setLoading(false))
  }, [router])

  const all = useMemo(() => [...active, ...history], [active, history])

  // Current date in IST
  const todayStr = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  }, [])

  const todayAppts  = useMemo(() => all.filter(a => a.date === todayStr), [all, todayStr])
  const uniquePats  = useMemo(() => new Set(all.map(a => a.patientId?._id).filter(Boolean)).size, [all])
  const pending     = useMemo(() => active.filter(a => a.status === 'PENDING').length, [active])
  const completed   = useMemo(() => all.filter(a => a.status === 'COMPLETED').length, [all])

  // Completion rate
  const completionRate = all.length > 0 ? Math.round((completed / all.length) * 100) : 0

  // Chart aggregation
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {}
    all.forEach(a => {
      counts[a.status] = (counts[a.status] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      label: STATUS_CONFIG[name]?.label || name,
      color: STATUS_CONFIG[name]?.color || '#94a3b8'
    }))
  }, [all])

  // Calendar calculations
  const year      = calMonth.getFullYear()
  const month     = calMonth.getMonth()
  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  
  // Dates with appointments mapped to counts
  const apptDatesMap = useMemo(() => {
    const map = new Map<string, number>()
    all.forEach(a => {
      if (a.date) {
        map.set(a.date, (map.get(a.date) || 0) + 1)
      }
    })
    return map
  }, [all])

  // Appointments to display in schedule queue
  const displayAppts = useMemo(() => {
    const base = selectedDate ? all.filter(a => a.date === selectedDate) : todayAppts
    if (filterStatus === 'ALL') return base
    return base.filter(a => a.status === filterStatus)
  }, [selectedDate, all, todayAppts, filterStatus])

  const initials = (name: string) =>
    (name || '?')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  // Dynamic greeting based on current hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <DoctorSidebar>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400 gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Synchronizing clinical dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-7xl mx-auto">
          
          {/* Executive Welcome Hero Banner */}
          <div className="relative bg-gradient-to-r from-slate-900 via-[#0e1d37] to-indigo-950 rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl border border-slate-800">
            {/* Background Decorative Rings */}
            <div className="absolute right-[-40px] top-[-40px] w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-[20%] bottom-[-50px] w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Clinic Online • Ready for Appointments
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    • IST ({todayStr})
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {greeting}, {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                </h1>
                <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
                  You have <span className="text-white font-bold">{todayAppts.length} appointments</span> scheduled for today. {pending > 0 ? `${pending} pending consultations require your review.` : 'All upcoming consultations are up to date.'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/doctor/availability"
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition flex items-center gap-2"
                >
                  <Clock size={15} className="text-indigo-300" />
                  <span>Set Availability</span>
                </Link>
                <Link
                  href="/doctor/appointments"
                  className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  <CalendarDays size={15} />
                  <span>Appointments Hub</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<CalendarDays size={22} className="text-blue-600" />}
              label="Total Appointments"
              value={all.length}
              subtext="Cumulative bookings"
              badgeText="All Time"
              gradient="bg-blue-500"
              accentColor="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={<Clock size={22} className="text-indigo-600" />}
              label="Today's Schedule"
              value={todayAppts.length}
              subtext={`${todayAppts.filter(a => a.status === 'COMPLETED').length} finished today`}
              badgeText="Live"
              gradient="bg-indigo-500"
              accentColor="bg-indigo-50 text-indigo-600"
            />
            <StatCard
              icon={<Users size={22} className="text-emerald-600" />}
              label="Unique Patients"
              value={uniquePats}
              subtext="Registered patient base"
              badgeText="Active"
              gradient="bg-emerald-500"
              accentColor="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={<AlertCircle size={22} className={pending > 0 ? "text-amber-600" : "text-slate-400"} />}
              label="Pending Triage"
              value={pending}
              subtext={pending > 0 ? "Require your confirmation" : "No pending requests"}
              badgeText={pending > 0 ? "Action Req" : "Clear"}
              gradient="bg-amber-500"
              accentColor="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Middle Section: Analytics Chart + Schedule Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: Analytics & Performance Metrics (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Doughnut Chart Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Appointment Analytics</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Status breakdown of all consultations</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-500">
                    <Activity size={18} />
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No consultation data recorded yet.
                  </div>
                ) : (
                  <div>
                    {/* Recharts Doughnut with Center Metric */}
                    <div className="relative h-56 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={88}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                const pct = all.length > 0 ? Math.round((data.value / all.length) * 100) : 0
                                return (
                                  <div className="bg-slate-900 text-white text-xs py-1.5 px-3 rounded-xl shadow-xl border border-slate-800">
                                    <p className="font-bold">{data.label}</p>
                                    <p className="text-slate-300 font-mono mt-0.5">{data.value} appointments ({pct}%)</p>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      {/* Center Stats Display */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 tracking-tight">{all.length}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                      </div>
                    </div>

                    {/* Interactive Legend Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                      {chartData.map(d => {
                        const pct = all.length > 0 ? Math.round((d.value / all.length) * 100) : 0
                        return (
                          <div
                            key={d.name}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                                style={{ backgroundColor: d.color }}
                              />
                              <span className="font-semibold text-slate-700 truncate">{d.label}</span>
                            </div>
                            <span className="font-mono text-slate-500 font-medium ml-2">
                              {d.value} <span className="text-[10px] text-slate-400">({pct}%)</span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Efficiency & Quality Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Practice Performance</h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    High Reliability
                  </span>
                </div>

                {/* Progress 1: Completion Rate */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Consultation Completion Rate</span>
                    <span className="font-bold text-slate-900">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, completionRate))}%` }}
                    />
                  </div>
                </div>

                {/* Micro Stats Row */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Session</p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">30 Mins</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Structured Slots</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmation</p>
                    <p className="text-base font-extrabold text-slate-800 mt-0.5">
                      {all.length > 0 ? Math.round(((all.length - pending) / all.length) * 100) : 100}%
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Zero Bottlenecks</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Today / Selected Date Schedule (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {selectedDate ? `Schedule for ${selectedDate}` : "Today's Patient Schedule"}
                      </h2>
                      {selectedDate && (
                        <button
                          onClick={() => setSelectedDate('')}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-0.5 rounded-full bg-indigo-50 transition"
                        >
                          Reset to Today
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedDate
                        ? `Filtered consultations for selected calendar day (${displayAppts.length} found)`
                        : `All consultations for ${todayStr} (${displayAppts.length} total)`}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl transition ${
                          filterStatus === status
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status[0] + status.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointment Queue List */}
                <div className="mt-4 space-y-3">
                  {displayAppts.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
                        <Calendar size={28} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No appointments scheduled</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {selectedDate
                          ? `No patient consultations found on ${selectedDate}.`
                          : "You have no appointments on your schedule for today."}
                      </p>
                      <Link
                        href="/doctor/appointments"
                        className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        View all clinic appointments <ArrowRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    displayAppts.map((a: any) => {
                      const cfg = STATUS_CONFIG[a.status] || {
                        label: a.status,
                        badge: 'bg-slate-100 text-slate-600 border-slate-200',
                        color: '#94a3b8'
                      }
                      const patientName = a.patientId?.name || 'Patient'
                      const isPaid = a.paymentStatus === 'PAID'

                      return (
                        <div
                          key={a._id}
                          className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-slate-50/50 hover:bg-white transition-all duration-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* Patient Avatar & Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                              {initials(patientName)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900 truncate">{patientName}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {a.reason || 'General Consultation'} • {a.patientId?.email || 'Registered Patient'}
                              </p>
                            </div>
                          </div>

                          {/* Time Slot & Badges */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs">
                                <Clock size={12} className="text-indigo-500" />
                                <span>{a.timeSlot}</span>
                              </div>
                              <div className="mt-1">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                  isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                }`}>
                                  {isPaid ? '✓ Paid' : '⏳ Payment Pending'}
                                </span>
                              </div>
                            </div>

                            <Link
                              href="/doctor/appointments"
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Manage appointment"
                            >
                              <ArrowUpRight size={18} />
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Bottom Quick Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Showing {displayAppts.length} of {all.length} total records
                </span>
                <Link
                  href="/doctor/appointments"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition"
                >
                  <span>Open Full Appointments Hub</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

            </div>

          </div>

          {/* Bottom Section: Interactive Month Calendar & Practice Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Calendar Card (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click any date to inspect appointment schedule</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCalMonth(new Date())
                      setSelectedDate(todayStr)
                    }}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  >
                    Today
                  </button>
                  <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition border-r border-slate-200"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                      className="p-1.5 hover:bg-slate-50 text-slate-500 transition"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                  const isToday    = dateStr === todayStr
                  const count      = apptDatesMap.get(dateStr) || 0
                  const hasAppt    = count > 0
                  const isSelected = dateStr === selectedDate

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                      className={`relative min-h-[44px] rounded-2xl flex flex-col items-center justify-center text-xs font-semibold transition-all duration-150 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 z-10'
                          : isToday
                          ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-400/50 font-bold'
                          : hasAppt
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-100'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{d}</span>
                      {hasAppt && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-indigo-500'
                            }`}
                          />
                          {count > 1 && (
                            <span className={`text-[9px] font-mono leading-none ${
                              isSelected ? 'text-indigo-100' : 'text-indigo-600'
                            }`}>
                              {count}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Scheduled Consultations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-50 border border-indigo-400" />
                  <span>Current Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-md bg-indigo-600 text-white text-[8px] flex items-center justify-center font-bold">✓</span>
                  <span>Selected Date</span>
                </div>
              </div>
            </div>

            {/* Quick Practice Roster & Security Badge (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Recent Patient Roster */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Recent Patients</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quick lookup of frequent visitors</p>
                  </div>
                  <Link
                    href="/doctor/patients"
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Directory <ArrowRight size={13} />
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">
                  {all.slice(0, 4).map((a: any) => {
                    const patName = a.patientId?.name || 'Patient'
                    return (
                      <div key={a._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials(patName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{patName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{a.patientId?.email || a.date}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                          {a.date}
                        </span>
                      </div>
                    )
                  })}
                  {all.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No patients found</p>
                  )}
                </div>
              </div>

              {/* Security & System Readiness Badge */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">CareSync Clinical Guard</h4>
                    <p className="text-[11px] text-slate-400">Synchronized & HIPAA Ready</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Patient medical histories, diagnostic files, and consultation telemetry are end-to-end encrypted with zero external data sharing.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>API Latency: 42ms</span>
                  <span className="text-emerald-400 font-semibold">● 99.98% Uptime</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </DoctorSidebar>
  )
}
