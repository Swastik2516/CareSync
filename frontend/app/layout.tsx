import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://kle-appointment-booking.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KLE Doctor Appointment Booking, Belagavi | KLE Belgaum",
    template: "%s | KLE Dr. Prabhakar Kore Hospital",
  },
  description:
    "Book doctor appointments online, check specialist availability and schedule consultations at KLE Dr. Prabhakar Kore Hospital, Belagavi, Karnataka.",
  keywords: [
    'KLE appointment booking Belagavi',
    'KLE Hospital appointment booking',
    'KLE Hospital online appointment Belgaum',
    'KLE Prabhakar Kore Hospital appointment booking',
    'doctor appointment booking Belagavi',
    'KLE Hospital Belagavi doctors',
    'online doctor consultation Belagavi',
    'KLE Dr. Prabhakar Kore Hospital',
  ],
  authors: [{ name: 'KLE Dr. Prabhakar Kore Hospital' }],
  creator: 'KLE Dr. Prabhakar Kore Hospital',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'KLE Dr. Prabhakar Kore Hospital',
    title: "KLE Doctor Appointment Booking, Belagavi | KLE Belgaum",
    description:
      "Book doctor appointments online, check specialist availability and schedule consultations at KLE Dr. Prabhakar Kore Hospital, Belagavi, Karnataka.",
    images: [
      {
        url: `${SITE_URL}/kle-logo.webp`,
        width: 512,
        height: 512,
        alt: "KLE Dr. Prabhakar Kore Hospital, Belagavi",
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "KLE Doctor Appointment Booking, Belagavi | KLE Belgaum",
    description:
      "Book doctor appointments online, check specialist availability and schedule consultations at KLE Dr. Prabhakar Kore Hospital, Belagavi, Karnataka.",
    images: [`${SITE_URL}/kle-logo.webp`],
  },
  icons: {
    icon: '/KLE.png',
    shortcut: '/KLE.png',
    apple: '/KLE.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
