'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Stethoscope, CalendarDays, FileText, User,
  LogOut, Bell, Menu, X, HeartPulse, ShieldCheck, Sparkles
} from 'lucide-react'

const MAIN_NAV = [
  { label: 'Dashboard',       href: '/patient/dashboard',        icon: LayoutDashboard },
  { label: 'Find Doctors',    href: '/patient/doctors',          icon: Stethoscope },
  { label: 'My Appointments', href: '/patient/appointments',     icon: CalendarDays },
  { label: 'Health Records',  href: '/patient/health-records',   icon: FileText },
  { label: 'Profile',         href: '/patient/profile',          icon: User },
]

export default function PatientSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    setName(localStorage.getItem('name') ?? 'Patient')
  }, [router])

  const logout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const initials = (name || 'Patient')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0c1322] border-r border-slate-800 text-slate-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/patient/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <HeartPulse size={20} />
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight">Care<span className="text-indigo-400">Sync</span></span>
            <span className="block text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Patient Portal</span>
          </div>
        </Link>
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Patient Profile Card */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white text-sm truncate">{name}</p>
            <span className="inline-block text-[11px] text-indigo-400 font-medium">Verified Patient</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu
        </p>
        {MAIN_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 translate-x-1'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Security & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/40 flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-indigo-400 shrink-0" />
          <span className="text-[11px] font-medium text-indigo-300">HIPAA Encrypted Portal</span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition"
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
        {/* Top Header */}
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
                {MAIN_NAV.find(n => isActive(n.href))?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Welcome back, {name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {initials}
            </div>

            <button
              onClick={logout}
              className="hidden sm:block text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-2 rounded-xl hover:bg-rose-50 transition"
            >
              Logout
            </button>
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
