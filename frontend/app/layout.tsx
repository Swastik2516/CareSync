import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = 'https://kle-appointment-booking.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KLE Hospital Appointment Booking Belagavi | CareSync",
    template: "%s | CareSync – KLE Hospital Belagavi",
  },
  description:
    "Book doctor appointments online at KLE's Dr. Prabhakar Kore Hospital & Medical Research Centre, Belagavi (Belgaum). Instant online appointment booking for KLE Hospital specialists.",
  keywords: [
    'KLE appointment booking Belagavi',
    'KLE Hospital appointment booking',
    'KLE Hospital online appointment Belgaum',
    'KLE Prabhakar Kore Hospital appointment booking',
    'doctor appointment booking Belagavi',
    'CareSync appointment booking',
    'KLE Hospital Belagavi doctors',
    'online doctor consultation Belagavi',
  ],
  authors: [{ name: 'CareSync' }],
  creator: 'CareSync',
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'CareSync – KLE Hospital Appointment Booking',
    title: "KLE Hospital Appointment Booking Belagavi | CareSync",
    description:
      "Book doctor appointments online at KLE's Dr. Prabhakar Kore Hospital & Medical Research Centre, Belagavi. Fast, secure, and paperless.",
    images: [
      {
        url: `${SITE_URL}/kle-logo.webp`,
        width: 512,
        height: 512,
        alt: "KLE Hospital Belagavi – CareSync Appointment Booking",
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: "KLE Hospital Appointment Booking Belagavi | CareSync",
    description:
      "Book doctor appointments online at KLE's Dr. Prabhakar Kore Hospital, Belagavi.",
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
