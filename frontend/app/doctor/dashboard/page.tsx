'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { CalendarDays, Users, Clock, CheckCircle, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#4169e1',
  PENDING:   '#f5b83d',
  COMPLETED: '#46b98b',
  CANCELLED: '#ef7b87',
  MISSED:    '#a78bfa',
}

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
  MISSED:    'bg-purple-100 text-purple-700',
}

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [active, setActive]   = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    Promise.all([
      apiClient.get('/appointments/doctor'),
      apiClient.get('/appointments/doctor/history'),
    ]).then(([a, h]) => {
      setActive(a.data || [])
      setHistory(h.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const all = [...active, ...history]

  // IST today
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

  const todayAppts  = all.filter(a => a.date === todayStr)
  const uniquePats  = new Set(all.map(a => a.patientId?._id)).size
  const pending     = active.filter(a => a.status === 'PENDING').length

  // Chart data
  const statusCounts = all.reduce((acc: Record<string, number>, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1
    return acc
  }, {})
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Calendar
  const year  = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay  = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const apptDates = new Set(all.map(a => a.date))

  const displayAppts = selectedDate
    ? all.filter(a => a.date === selectedDate)
    : todayAppts

  const initials = (name: string) => (name || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <DoctorSidebar>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading dashboard...</div>
      ) : (
        <div className="space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<CalendarDays size={22} />} label="Total Appointments" value={all.length} sub="All time" color="bg-blue-100 text-blue-600" />
            <StatCard icon={<Clock size={22} />} label="Today's Appointments" value={todayAppts.length} sub="Scheduled today" color="bg-indigo-100 text-indigo-600" />
            <StatCard icon={<Users size={22} />} label="Total Patients" value={uniquePats} sub="Unique patients" color="bg-emerald-100 text-emerald-600" />
            <StatCard icon={<CheckCircle size={22} />} label="Pending" value={pending} sub="Require attention" color="bg-amber-100 text-amber-600" />
          </div>

          {/* Chart + Today's Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Doughnut chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">Appointment Analytics</h2>
              {chartData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-10">No data yet</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                    {chartData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.name] || '#cbd5e1' }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Today / selected date appointments */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">
                  {selectedDate ? `Appointments — ${selectedDate}` : "Today's Appointments"}
                </h2>
                {selectedDate && (
                  <button onClick={() => setSelectedDate('')} className="text-xs text-blue-600 hover:underline">Clear</button>
                )}
              </div>
              {displayAppts.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">No appointments {selectedDate ? 'on this date' : 'today'}.</p>
              ) : (
                <div className="space-y-3">
                  {displayAppts.slice(0, 5).map((a: any) => (
                    <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(a.patientId?.name || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{a.patientId?.name || 'Patient'}</p>
                        <p className="text-xs text-gray-400">{a.timeSlot} · {a.reason}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${STATUS_BADGE[a.status] || 'bg-gray-100 text-gray-600'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/doctor/appointments"
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold transition">
                View All Appointments <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                {calMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={16} /></button>
                <button onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-[11px] font-bold text-gray-400 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const isToday    = dateStr === todayStr
                const hasAppt    = apptDates.has(dateStr)
                const isSelected = dateStr === selectedDate
                return (
                  <button key={d} onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                    className={`relative py-1.5 rounded-lg text-xs font-medium transition ${
                      isSelected ? 'bg-blue-600 text-white' :
                      isToday    ? 'bg-blue-100 text-blue-700 font-bold' :
                                   'hover:bg-gray-100 text-gray-700'
                    }`}>
                    {d}
                    {hasAppt && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </DoctorSidebar>
  )
}
