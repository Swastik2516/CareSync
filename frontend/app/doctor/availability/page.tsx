'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'

// 08:00–22:00, skip 13:00 (lunch break)
const HOURS = Array.from({ length: 15 }, (_, i) =>
  `${String(8 + i).padStart(2, '0')}:00`
).filter(h => h !== '13:00')

function getIST() {
  const now = new Date()
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false,
    }).format(now),
    10
  )
  return { todayStr, currentHour }
}

export default function DoctorAvailabilityPage() {
  const router = useRouter()

  // Re-compute IST every minute so slots auto-disable as time passes
  const [ist, setIst] = useState(getIST)
  const { todayStr, currentHour } = ist

  const [date, setDate] = useState(() => getIST().todayStr)
  const [selected, setSelected] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login')
    // Refresh IST every 60 seconds
    const timer = setInterval(() => setIst(getIST()), 60_000)
    return () => clearInterval(timer)
  }, [])

  // Drop selected slots that became past when time ticks or date changes to today
  useEffect(() => {
    if (date === todayStr) {
      setSelected(prev => prev.filter(h => parseInt(h) >= currentHour))
    }
  }, [date, currentHour, todayStr])

  const isPast = (h: string) => date === todayStr && parseInt(h) < currentHour

  const toggle = (h: string) => {
    if (isPast(h)) return
    setSelected(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])
  }

  const handleSave = async () => {
    if (!selected.length) return setMsg('❌ Select at least one time slot.')
    setLoading(true)
    setMsg('')
    try {
      const slots = selected.map(h => {
        const hh = parseInt(h)
        return { startTime: h, endTime: `${String(hh + 1).padStart(2, '0')}:00` }
      })
      await apiClient.post('/doctors/availability', { date, slots })
      setMsg('✅ Availability saved successfully!')
      setSelected([])
    } catch (err: any) {
      setMsg(`❌ ${err.response?.data?.error ?? 'Failed to save'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Set Availability</h1>

        <div className="bg-white border border-gray-100 rounded-3xl p-6">
          <label className="text-sm font-medium text-gray-700">Select Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={todayStr}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 mb-6 outline-none focus:border-indigo-400" />

          <label className="text-sm font-medium text-gray-700">Select Hours (8AM – 10PM, lunch break 1–2PM)</label>
          <div className="flex flex-wrap gap-3 mt-3 mb-6">
            {HOURS.map(h => {
              const passed = isPast(h)
              const isSelected = selected.includes(h)
              return (
                <button key={h} disabled={passed} onClick={() => toggle(h)} type="button"
                  className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition ${
                    passed
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400'
                  }`}>
                  {h}
                  {passed && <span className="block text-[10px] text-red-400 font-bold mt-0.5">Passed</span>}
                </button>
              )
            })}

            {/* Lunch break indicator */}
            <div className="px-4 py-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50 text-sm font-semibold text-orange-400 cursor-not-allowed">
              13:00
              <span className="block text-[10px] font-bold mt-0.5">Lunch</span>
            </div>
          </div>

          {msg && (
            <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg}
            </div>
          )}

          <button onClick={handleSave} disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition">
            {loading ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  )
}
