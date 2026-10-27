'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { Star, MapPin, Clock, DollarSign } from 'lucide-react'

export default function DoctorProfilePage() {
  const router = useRouter()
  const params = useParams()
  const doctorId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '')

  const [doctor, setDoctor]             = useState<any>(null)
  const [slots, setSlots]               = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [booking, setBooking]           = useState(false)
  const [msg, setMsg]                   = useState('')



  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return }
    if (!doctorId) return
    apiClient.get(`/doctors/${doctorId}`)
      .then(r => setDoctor(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [doctorId])

  useEffect(() => {
    if (!doctorId) return
    apiClient.get(`/doctors/availability?doctorId=${doctorId}&date=${date}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
    setSelectedSlot(null)
  }, [date, doctorId])

  const handleBook = async () => {
    if (!selectedSlot) return
    setBooking(true)
    setMsg('')
    try {
      const res = await apiClient.post('/appointments/book', {
        doctorId,
        date,
        timeSlot: selectedSlot,
        reason: reason || 'General Consultation',
      })
      router.push('/patient/appointments')
    } catch (err: any) {
      setMsg(`❌ ${err.response?.data?.message ?? err.response?.data?.error ?? 'Booking failed'}`)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Loading...</div>
    </div>
  )
  if (!doctor) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="text-center py-20 text-gray-400">Doctor not found.</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Doctor Info Card */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <img src={doctor.profileImage} alt={doctor.userId?.name} className="w-full h-52 object-cover" />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{doctor.userId?.name}</h1>
            <p className="text-indigo-600 font-medium mt-1">{doctor.specialization}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={14} />{doctor.hospital}</span>
              <span className="flex items-center gap-1"><Clock size={14} />{doctor.experience} yrs exp</span>
              <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" />{doctor.rating}</span>
              <span className="flex items-center gap-1"><DollarSign size={14} />${doctor.consultationFee}</span>
            </div>
            <p className="text-gray-600 text-sm mt-4 leading-6">{doctor.bio}</p>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mt-4">
          <h2 className="font-bold text-gray-900 mb-4">Book Appointment</h2>

          <label className="text-sm text-gray-600 font-medium">Select Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 mb-4 outline-none focus:border-indigo-400" />

          <label className="text-sm text-gray-600 font-medium">Available Time Slots</label>
          {slots.length === 0 ? (
            <p className="text-gray-400 text-sm mt-2 mb-4">No slots available for this date.</p>
          ) : (
            <div className="flex flex-wrap gap-3 mt-2 mb-4">
              {slots.map((slot: any) => {
                const isFull     = slot.bookedCount >= 10
                const isSelected = selectedSlot === slot.time
                return (
                  <button key={slot.time} disabled={isFull} onClick={() => setSelectedSlot(slot.time)}
                    className={`px-4 py-2 rounded-2xl border text-sm font-semibold transition ${
                      isFull     ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      : isSelected ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400'
                    }`}>
                    {slot.time}
                    <span className={`block text-xs mt-0.5 ${isFull ? 'text-red-400 font-bold' : isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {isFull ? 'Full' : `${slot.bookedCount}/10`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <label className="text-sm text-gray-600 font-medium">Reason (optional)</label>
          <input type="text" placeholder="e.g. General Consultation" value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 mt-1 mb-4 outline-none focus:border-indigo-400" />

          {msg && (
            <div className="text-sm px-4 py-3 rounded-xl mb-4 bg-red-50 text-red-600">{msg}</div>
          )}

          <button onClick={handleBook} disabled={!selectedSlot || booking}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition">
            {booking ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>


    </div>
  )
}
