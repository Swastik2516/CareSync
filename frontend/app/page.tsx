import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-950/90 backdrop-blur z-50">
        <div className="flex items-center"></div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500">
            Login
          </Link>
          <Link href="/register" className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl transition shadow-lg shadow-indigo-600/30">
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <Image src="/kle-logo.webp" alt="KLE Hospital" width={140} height={140} className="object-contain mb-6 drop-shadow-2xl" priority />
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 text-transparent bg-clip-text leading-tight mb-4">
          KLE's Dr. Prabhakar Kore<br />Hospital & Medical Research Centre
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mb-8">
          A premier healthcare institution delivering world-class medical care. Book appointments, manage health records, and connect with specialist doctors — all in one place.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/30 transition text-sm">
            Get Started
          </Link>
          <Link href="/login" className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-2xl transition text-sm">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-center text-white mb-12">Everything You Need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '📅', title: 'Easy Appointment Booking', desc: 'Patients can browse available doctors, check real-time availability, and book appointments in minutes.' },
            { icon: '🩺', title: 'Doctor Dashboard', desc: 'Doctors can manage appointments, view patient history, set availability slots, and track payments.' },
            { icon: '📋', title: 'Health Records', desc: 'Patients can securely store and access medical reports, prescriptions, and consultation history.' },
            { icon: '💳', title: 'Online Payments', desc: 'Seamless and secure consultation fee payments integrated directly into the booking flow.' },
            { icon: '🔔', title: 'Notifications', desc: 'Get email reminders for upcoming appointments and important health updates.' },
            { icon: '🔒', title: 'Secure & Private', desc: 'Your health data is encrypted and protected. We follow strict data privacy standards.' },
          ].map(f => (
            <div key={f.title} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 transition">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">Consultation Fees</h2>
          <p className="text-slate-400 mb-8">Fees are set by individual doctors based on their specialization and experience. You will see the exact consultation fee before confirming your booking.</p>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <p className="text-slate-300 text-sm">💡 Consultation fees vary per doctor. No hidden charges. Full fee transparency before payment.</p>
            <p className="text-slate-400 text-xs mt-3">Refunds are processed as per our Refund Policy below.</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-black text-white mb-4">Contact & Support</h2>
        <p className="text-slate-400 mb-6">For any queries, appointment support, or technical issues, reach out to us.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3 text-sm text-slate-300">
          <p>📧 Support Email: <a href="mailto:support@klehospital.org" className="text-indigo-400 hover:text-indigo-300">support@klehospital.org</a></p>
          <p>🏥 KLE's Dr. Prabhakar Kore Hospital & Medical Research Centre</p>
          <p>📍 Nehru Nagar, Belagavi, Karnataka – 590010</p>
          <p>📞 +91-831-2470000</p>
        </div>
      </section>

      {/* Policies */}
      <section className="px-6 py-16 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-10">Policies</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">🔐 Privacy Policy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">We collect only the information necessary to provide healthcare services. Your personal and medical data is never sold or shared with third parties. Data is encrypted and stored securely.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">📄 Terms & Conditions</h3>
              <p className="text-slate-400 text-sm leading-relaxed">By using this platform, you agree to use it solely for legitimate healthcare purposes. Misuse, false information, or unauthorized access will result in account termination.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-3">💰 Refund Policy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Cancellations made 24 hours before the appointment are eligible for a full refund. No-shows or late cancellations may not be refunded. Refunds are processed within 5–7 business days.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} KLE's Dr. Prabhakar Kore Hospital & Medical Research Centre. All rights reserved.</p>
        <p className="mt-2">Powered by <span className="text-indigo-400 font-semibold">CareSync</span></p>
      </footer>

    </div>
  )
}
