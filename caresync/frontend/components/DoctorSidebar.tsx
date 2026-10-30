'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'
import {
  LayoutDashboard, CalendarDays, Clock, Users, CalendarCheck,
  CreditCard, UserCircle, Settings, LogOut, Bell, Menu, X
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',            href: '/doctor/dashboard',     icon: LayoutDashboard },
  { label: 'Appointments',         href: '/doctor/appointments',  icon: CalendarDays },
  { label: 'Availability',         href: '/doctor/availability',  icon: Clock },
  { label: 'Patients',             href: '/doctor/patients',      icon: Users },
  { label: 'Payments',             href: '/doctor/payments',      icon: CreditCard },
  { label: 'Profile',              href: '/doctor/profile',       icon: UserCircle },
  { label: 'Settings',             href: '/doctor/settings',      icon: Settings },
]

export default function DoctorSidebar({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [name, setName]           = useState('')
  const [spec, setSpec]           = useState('')
  const [photo, setPhoto]         = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const [open, setOpen]           = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }
    const n = localStorage.getItem('name') || 'Doctor'
    setName(n)
    try {
      const userId = JSON.parse(atob(token.split('.')[1])).userId
      apiClient.get(`/doctors/${userId}`).then(r => {
        setSpec(r.data.specialization || '')
        setPhoto(r.data.profileImage || '')
      }).catch(() => {})
    } catch {}
  }, [])

  const logout = () => { localStorage.clear(); router.push('/login') }
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-extrabold text-blue-600 tracking-tight">CareSync</span>
      </div>

      {/* Doctor info */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-gray-100">
        <div className="relative mb-3">
          {photo ? (
            <img src={photo} alt={name} className="w-16 h-16 rounded-full object-cover border-4 border-blue-100" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold border-4 border-blue-50">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
        </div>
        <p className="font-bold text-gray-900 text-sm text-center">{name.startsWith('Dr.') ? name : `Dr. ${name}`}</p>
        {spec && <p className="text-xs text-gray-400 mt-0.5 text-center">{spec}</p>}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
              }`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f3f6fc]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-56 bg-white shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {NAV.find(n => pathname.startsWith(n.href))?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-400">
                Welcome back, {name.startsWith('Dr.') ? name : `Dr. ${name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <div className="relative">
              <button className="p-2 rounded-xl hover:bg-gray-100 relative">
                <Bell size={20} className="text-gray-500" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {notifCount}
                  </span>
                )}
              </button>
            </div>
            {photo ? (
              <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover border-2 border-blue-100" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
