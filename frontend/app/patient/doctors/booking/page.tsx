'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { Star, MapPin, Clock, IndianRupee, CreditCard, Banknote, X, Loader2, ArrowLeft } from 'lucide-react'

function BookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const doctorId     = searchParams.get('id') ?? ''
  const hospitalParam = searchParams.get('hospital') ?? ''

  const [doctor, setDoctor]             = useState<any>(null)
  const [slots, setSlots]               = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0])
  const [reason, setReason]             = useState('')
  const [loading, setLoading]           = useState(true)
  const [booking, setBooking]           = useState(false)
  const [msg, setMsg]                   = useState('')
  const [showPayModal, setShowPayModal] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) { router.push('/login'); return }
    if (!doctorId) return
    apiClient.get(`/doctors/${doctorId}`)
      .then(r => setDoctor(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [doctorId, router])

  useEffect(() => {
    if (!doctorId) return
    apiClient.get(`/doctors/availability?doctorId=${doctorId}&date=${date}`)
      .then(r => setSlots(r.data))
      .catch(() => setSlots([]))
    setSelectedSlot(null)
  }, [date, doctorId])

  const handleBookClick = () => {
    if (!selectedSlot) return
    setMsg('')
    setShowPayModal(true)
  }

  const handlePayOnline = async () => {
    setBooking(true)
    setMsg('')
    try {
      const res = await apiClient.post('/appointments/book', {
        doctorId,
        date,
        timeSlot: selectedSlot,
        reason: reason || 'General Consultation',
        hospital: hospitalParam,
      })
      const appt = res.data?.appointment ?? res.data
      setShowPayModal(false)
      router.push(
        `/patient/pay?appointmentId=${appt._id}&amount=${doctor.consultationFee}` +
        `&doctorName=${encodeURIComponent(doctor.userId?.name ?? '')}&date=${date}` +
        `&timeSlot=${encodeURIComponent(selectedSlot ?? '')}&doctorId=${doctorId}`
      )
    } catch (err: any) {
      setMsg(`❌ ${err.response?.data?.message ?? err.response?.data?.error ?? 'Booking failed'}`)
      setShowPayModal(false)
    } finally {
      setBooking(false)
    }
  }

  const handlePayAtOPD = async () => {
    setBooking(true)
    setMsg('')
    try {
      await apiClient.post('/appointments/book', {
        doctorId,
        date,
        timeSlot: selectedSlot,
        reason: reason || 'General Consultation',
        paymentMode: 'CASH',
        hospital: hospitalParam,
      })
      setShowPayModal(false)
      router.push('/patient/appointments')
    } catch (err: any) {
      setMsg(`❌ ${err.response?.data?.message ?? err.response?.data?.error ?? 'Booking failed'}`)
      setShowPayModal(false)
    } finally {
      setBooking(false)
    }
  }

  const backUrl = doctorId
    ? `/patient/doctors/${doctorId}${hospitalParam ? `?hospital=${encodeURIComponent(hospitalParam)}` : ''}`
    : '/patient/doctors'

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

        {/* Back button */}
        <button
          onClick={() => router.push(backUrl)}
          className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-5 transition"
        >
          <ArrowLeft size={16} /> Back to doctor
        </button>

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
              <span className="flex items-center gap-1"><IndianRupee size={14} />₹{doctor.consultationFee}</span>
            </div>
            <p className="text-gray-600 text-sm mt-4 leading-6">{doctor.bio}</p>
          </div>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mt-4">
          <h2 className="font-bold text-gray-900 mb-4">Book Appointment</h2>

          {hospitalParam && (
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-4">
              <MapPin size={13} className="shrink-0" />
              <span className="font-medium truncate">{hospitalParam}</span>
            </div>
          )}

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

          <button onClick={handleBookClick} disabled={!selectedSlot || booking}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition">
            {booking ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>

      {/* Payment Choice Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowPayModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">How would you like to pay?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Consultation fee: <span className="font-bold text-indigo-600">₹{doctor.consultationFee}</span>
            </p>

            {/* Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-900">{doctor.userId?.name}</span>
              </div>
              {hospitalParam && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Hospital</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%] leading-snug">{hospitalParam}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-semibold text-gray-900">{selectedSlot}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handlePayOnline} disabled={booking}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition text-left disabled:opacity-60">
                <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  {booking ? <Loader2 size={20} className="text-white animate-spin" /> : <CreditCard size={20} className="text-white" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pay Online</p>
                  <p className="text-xs text-gray-500 mt-0.5">UPI, Card, Net Banking via Razorpay — instant confirmation</p>
                </div>
              </button>

              <button onClick={handlePayAtOPD} disabled={booking}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-green-200 hover:border-green-500 bg-green-50 hover:bg-green-100 transition text-left disabled:opacity-60">
                <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                  {booking ? <Loader2 size={20} className="text-white animate-spin" /> : <Banknote size={20} className="text-white" />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pay at OPD / Clinic</p>
                  <p className="text-xs text-gray-500 mt-0.5">Pay cash or scan doctor's QR at the clinic on the day of visit</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DoctorBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center text-gray-400">Loading booking...</div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
