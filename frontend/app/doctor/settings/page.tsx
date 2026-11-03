'use client'
import DoctorSidebar from '@/components/DoctorSidebar'
import { Settings } from 'lucide-react'

export default function DoctorSettingsPage() {
  return (
    <DoctorSidebar>
      <div className="bg-white rounded-2xl border border-gray-100 p-10 shadow-sm text-center">
        <Settings size={40} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-700 mb-2">Settings</h2>
        <p className="text-sm text-gray-400">Account preferences and notification settings coming soon.</p>
      </div>
    </DoctorSidebar>
  )
}
