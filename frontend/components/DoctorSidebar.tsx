'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import apiClient from '@/lib/api'
import {
  LayoutDashboard, CalendarDays, Clock, Users,
  CreditCard, UserCircle, LogOut, Bell, Menu, X,
  HeartPulse, ShieldCheck, Sparkles
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',    href: '/doctor/dashboard',    icon: LayoutDashboard },
  { label: 'Appointments', href: '/doctor/appointments', icon: CalendarDays },
  { label: 'Availability', href: '/doctor/availability', icon: Clock },
  { label: 'Patients',     href: '/doctor/patients',     icon: Users },
  { label: 'Payments',     href: '/doctor/payments',     icon: CreditCard },
  { label: 'Profile',      href: '/doctor/profile',      icon: UserCircle },
]

export default function DoctorSidebar({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [name, setName]           = useState('')
  const [spec, setSpec]           = useState('')
  const [photo, setPhoto]         = useState('')
  const [notifCount, setNotifCount] = useState(0)
  const [open, setOpen]           = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const n = localStorage.getItem('name') || 'Doctor'
    setName(n)
    try {
      const userId = JSON.parse(atob(token.split('.')[1])).userId
      apiClient.get(`/doctors/${userId}`).then(r => {
        setSpec(r.data.specialization || '')
        setPhoto(r.data.profileImage || '')
      }).catch(() => {})
    } catch {}
  }, [router])

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <Link href="/doctor/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse size={20} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Care<span className="text-indigo-600">Sync</span></span>
            <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Clinical Suite</span>
          </div>
        </Link>
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Doctor Info Card */}
      <div className="p-5 border-b border-slate-100">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
          <div className="relative shrink-0">
            {photo ? (
              <img src={photo} alt={name} className="w-11 h-11 rounded-2xl object-cover border-2 border-white shadow-sm" />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {initials}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="font-bold text-slate-900 text-sm truncate">
                {name.startsWith('Dr.') ? name : `Dr. ${name}`}
              </p>
            </div>
            <p className="text-xs text-slate-400 truncate">{spec || 'Medical Specialist'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Management
        </p>
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1'
                  : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Security Info & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100/60 flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
          <span className="text-[11px] font-medium text-indigo-900">Encrypted Clinical Portal</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50/70 font-sans text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed top-0 left-0 h-full z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Sticky Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 rounded-2xl hover:bg-slate-100 text-slate-600 transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                {NAV.find(n => pathname.startsWith(n.href))?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Welcome back, {name.startsWith('Dr.') ? name : `Dr. ${name}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="relative">
              <button
                className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-500 transition relative"
                title="Notifications"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {notifCount}
                  </span>
                )}
              </button>
            </div>

            {photo ? (
              <img src={photo} alt={name} className="w-9 h-9 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm" />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {initials}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
