'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import apiClient from '@/lib/api'
import { CreditCard, IndianRupee } from 'lucide-react'

const MODE_BADGE: Record<string, string> = {
  CASH:   'bg-green-100 text-green-700',
  UPI:    'bg-purple-100 text-purple-700',
  CARD:   'bg-blue-100 text-blue-700',
  ONLINE: 'bg-indigo-100 text-indigo-700',
}

export default function DoctorPaymentsPage() {
  const router = useRouter()
  const [paid, setPaid]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    Promise.all([
      apiClient.get('/appointments/doctor'),
      apiClient.get('/appointments/doctor/history'),
    ]).then(([a, h]) => {
      const all = [...(a.data || []), ...(h.data || [])]
      setPaid(all.filter(x => x.paymentStatus === 'PAID'))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const total = paid.reduce((s, a) => s + (a.amount || 0), 0)
  const byMode = paid.reduce((acc: Record<string, number>, a) => {
    const m = a.paymentMode || 'CASH'
    acc[m] = (acc[m] || 0) + (a.amount || 0)
    return acc
  }, {})

  return (
    <DoctorSidebar>
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-gray-900">Payments</h2>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm col-span-2 sm:col-span-1">
            <p className="text-xs text-gray-400 font-semibold uppercase">Total Collected</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">₹{total}</p>
          </div>
          {Object.entries(byMode).map(([mode, amt]) => (
            <div key={mode} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs text-gray-400 font-semibold uppercase">{mode}</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">₹{amt as number}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : paid.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No payments recorded yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  {['Patient','Date','Amount','Mode','Ref'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paid.map(a => (
                  <tr key={a._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{a.patientId?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{a.date}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">₹{a.amount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${MODE_BADGE[a.paymentMode] || 'bg-gray-100 text-gray-600'}`}>
                        {a.paymentMode || 'CASH'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{a.appointmentId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorSidebar>
  )
}
