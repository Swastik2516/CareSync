'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import apiClient from '@/lib/api'
import { ShieldCheck, CreditCard, AlertCircle, Loader2 } from 'lucide-react'

// Extend window to include Razorpay checkout script type
declare global {
  interface Window { Razorpay: any }
}

function PaymentForm() {
  const router = useRouter()
  const params = useSearchParams()
  const appointmentId = params.get('appointmentId')
  const amount        = Number(params.get('amount') ?? 0)
  const doctorName    = params.get('doctorName') ?? 'Doctor'
  const date          = params.get('date') ?? ''
  const timeSlot      = params.get('timeSlot') ?? ''

  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState<'idle' | 'success' | 'failed'>('idle')
  const [error, setError]       = useState('')

  // Load Razorpay checkout.js script dynamically
  useEffect(() => {
    const script = document.createElement('script')
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handlePay = async () => {
    if (!appointmentId || !amount) return setError('Invalid payment details.')
    setLoading(true)
    setError('')

    try {
      // 1. Create Razorpay order via backend
      const { data } = await apiClient.post('/payments/create-order', {
        appointmentId,
        amount,
      })

      // 2. Open Razorpay checkout modal
      const options = {
        key:         data.keyId,
        amount:      data.amount,        // paise
        currency:    data.currency,
        name:        'CareSync',
        description: `Appointment with ${doctorName} on ${date} at ${timeSlot}`,
        order_id:    data.orderId,
        prefill: {
          name:  localStorage.getItem('name') ?? '',
          email: '',
        },
        theme: { color: '#4F46E5' },

        handler: () => {
          // Payment captured — webhook will update DB asynchronously
          setStatus('success')
          setTimeout(() => router.push('/patient/appointments'), 3000)
        },

        modal: {
          ondismiss: () => {
            setLoading(false)
            setError('Payment cancelled. You can try again.')
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setStatus('failed')
        setLoading(false)
      })
      rzp.open()

    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to initiate payment')
      setLoading(false)
    }
  }

  if (status === 'success') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
        <p className="text-gray-500 text-sm mt-2">Your appointment is confirmed. Redirecting...</p>
      </div>
    </div>
  )

  if (status === 'failed') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
        <p className="text-gray-500 text-sm mt-2 mb-6">Something went wrong. Please try again.</p>
        <button onClick={() => setStatus('idle')}
          className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-indigo-700 transition">
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="text-indigo-600" size={24} />
            <h1 className="text-2xl font-bold text-gray-900">Pay for Appointment</h1>
          </div>

          {/* Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Doctor</span>
              <span className="font-semibold text-gray-900">{doctorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-semibold text-gray-900">{date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="font-semibold text-gray-900">{timeSlot}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-indigo-600 text-lg">₹{amount}</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button onClick={handlePay} disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Pay ₹${amount} Securely`}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <ShieldCheck size={12} /> Secured by Razorpay
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return <Suspense><PaymentForm /></Suspense>
}
