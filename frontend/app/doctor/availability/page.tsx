'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'

const HOURS = Array.from({ length: 10 }, (_, i) => `${(9 + i).toString().padStart(2, '0')}:00`)

export default function DoctorAvailabilityPage() {
  const router = useRouter()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [selected, setSelected] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  useEffect(() => {
    if (!localStorage.getItem('token')) router.push('/login')
  }, [])

  // Deselect past hours if user switches date to today
  useEffect(() => {
    if (date === todayStr) {
      setSelected(prev => prev.filter(h => h > currentHHMM))
    }
  }, [date])

  const toggle = (h: string) => setSelected(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])

  const handleSave = async () => {
    if (!selected.length) return setMsg('❌ Select at least one valid future time slot.')
    setLoading(true)
    setMsg('')
    try {
      const slots = selected.map(h => {
        const hh = parseInt(h.split(':')[0])
        return { startTime: h, endTime: `${(hh + 1).toString().padStart(2, '0')}:00` }
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

          <label className="text-sm font-medium text-gray-700">Select Hours (9AM – 6PM)</label>
          <div className="flex flex-wrap gap-3 mt-3 mb-6">
            {HOURS.map(h => {
              const isPassed = date === todayStr && h <= currentHHMM
              const isSelected = selected.includes(h)
              return (
                <button key={h} disabled={isPassed} onClick={() => toggle(h)} type="button"
                  className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition ${
                    isPassed
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400'
                  }`}>
                  {h}
                  {isPassed && <span className="block text-[10px] text-red-400 font-bold mt-0.5">Passed</span>}
                </button>
              )
            })}
          </div>

          {msg && <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${msg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg}</div>}

          <button onClick={handleSave} disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition">
            {loading ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>
    </div>
  )
}
