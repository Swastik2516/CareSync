'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Bell, Calendar, X, Check, RefreshCw } from 'lucide-react'
import apiClient from '@/lib/api'

export default function Navbar() {
  const router = useRouter()
  const [role, setRole] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifMenu, setShowNotifMenu] = useState(false)

  const fetchNotifications = () => {
    if (localStorage.getItem('role') === 'PATIENT' && localStorage.getItem('token')) {
      apiClient.get('/appointments/notifications')
        .then(r => setNotifications(r.data || []))
        .catch(() => setNotifications([]))
    }
  }

  useEffect(() => {
    const userRole = localStorage.getItem('role')
    setRole(userRole)
    setName(localStorage.getItem('name'))
    fetchNotifications()

    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const markRead = async (appointmentId: string, notifId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    try {
      await apiClient.patch(`/appointments/${appointmentId}/notifications/${notifId}/read`)
      setNotifications(prev => prev.filter(n => n.notifId !== notifId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleRescheduleNotif = async (notif: any) => {
    await markRead(notif.appointmentId, notif.notifId, { stopPropagation: () => {} } as any)
    setShowNotifMenu(false)
    router.push(`/patient/appointments?reschedule=${notif.appointmentId}`)
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between relative z-40">
      <Link href={role === 'DOCTOR' ? '/doctor/appointments' : '/patient/doctors'}>
        <span className="text-xl font-bold text-indigo-600">CareSync</span>
      </Link>
      <div className="flex items-center gap-6">
        {role === 'PATIENT' && <>
          <Link href="/patient/doctors" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Find Doctors</Link>
          <Link href="/patient/appointments" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">My Appointments</Link>
          <Link href="/patient/health-records" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Health Records</Link>

          {/* Notification Bell Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition relative"
              title="Notifications"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-indigo-600" />
                    <span className="font-bold text-gray-900 text-sm">Notifications</span>
                    {notifications.length > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                        {notifications.length} new
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowNotifMenu(false)} className="text-gray-400 hover:text-gray-600 transition">
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.notifId} className="p-4 hover:bg-indigo-50/50 transition flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs text-gray-800 leading-relaxed font-medium">
                            {n.message}
                          </p>
                          <button
                            onClick={(e) => markRead(n.appointmentId, n.notifId, e)}
                            className="text-gray-400 hover:text-gray-600 shrink-0 p-1 rounded-lg hover:bg-gray-100"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-gray-400">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => handleRescheduleNotif(n)}
                            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
                          >
                            <RefreshCw size={12} />
                            Reschedule
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>}
        {role === 'DOCTOR' && <>
          <Link href="/doctor/appointments" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Appointments</Link>
          <Link href="/doctor/availability" className="text-sm text-gray-600 hover:text-indigo-600 font-medium">Availability</Link>
        </>}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{name}</span>
          <button onClick={logout} className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl font-medium transition">Logout</button>
        </div>
      </div>
    </nav>
  )
}
