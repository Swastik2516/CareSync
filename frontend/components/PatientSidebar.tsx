'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Stethoscope, CalendarDays, FileText, User,
  Salad, Moon, Dumbbell, Brain, HelpCircle, LogOut, Bell, Menu, X
} from 'lucide-react'

const MAIN_NAV = [
  { label: 'Dashboard',       href: '/patient/doctors',          icon: LayoutDashboard },
  { label: 'Find Doctors',    href: '/patient/doctors',          icon: Stethoscope },
  { label: 'My Appointments', href: '/patient/appointments',     icon: CalendarDays },
  { label: 'Health Records',  href: '/patient/health-records',   icon: FileText },
  { label: 'Profile',         href: '/patient/profile',          icon: User },
]

const WELLNESS_NAV = [
  { label: 'Food',            href: '/patient/wellness/food',    icon: Salad },
  { label: 'Sleep',           href: '/patient/wellness/sleep',   icon: Moon },
  { label: 'Exercise',        href: '/patient/wellness/exercise',icon: Dumbbell },
  { label: 'Mental Health',   href: '/patient/wellness/mental',  icon: Brain },
]

const SUPPORT_NAV = [
  { label: 'Help & Support',  href: '/patient/wellness/help',    icon: HelpCircle },
]

export default function PatientSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [name, setName]   = useState('')
  const [open, setOpen]   = useState(false)

  useEffect(() => {
    setName(localStorage.getItem('name') ?? 'Patient')
  }, [])

  const logout = () => { localStorage.clear(); router.push('/login') }
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const NavSection = ({ title, items }: { title: string; items: typeof MAIN_NAV }) => (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-gray-500 px-3 mb-2 mt-5">{title}</p>
      {items.map(({ label, href, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
              active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
            }`}>
            <Icon size={17} />
            {label}
          </Link>
        )
      })}
    </div>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1f1f1f]">
        <span className="text-xl font-extrabold text-white tracking-tight">Care<span className="text-indigo-500">Sync</span></span>
      </div>

      {/* Patient info */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1f1f1f]">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold truncate">{name}</p>
          <p className="text-gray-500 text-xs">Patient</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        <NavSection title="MAIN MENU" items={MAIN_NAV} />
        <hr className="border-[#1f1f1f] my-3" />
        <NavSection title="HEALTH & WELLNESS" items={WELLNESS_NAV} />
        <hr className="border-[#1f1f1f] my-3" />
        <NavSection title="SUPPORT" items={SUPPORT_NAV} />
      </nav>

      {/* Logout */}
      <div className="px-2 pb-5">
        <button onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-[#1a1a1a] hover:text-red-300 transition">
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f3f6fc]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 fixed top-0 left-0 h-full z-30 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 z-50 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                {[...MAIN_NAV, ...WELLNESS_NAV, ...SUPPORT_NAV].find(n => pathname.startsWith(n.href))?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-gray-400">Welcome, {name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl hover:bg-gray-100">
              <Bell size={18} className="text-gray-500" />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <button onClick={logout} className="hidden sm:block text-xs font-bold text-gray-500 hover:text-red-500 px-3 py-2 rounded-xl hover:bg-red-50 transition">
              Logout
            </button>
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
