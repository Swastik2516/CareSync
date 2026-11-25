import type { MetadataRoute } from 'next'

const SITE_URL = 'https://kle-appointment-booking.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/forgot-password'],
        disallow: [
          '/patient/',
          '/doctor/',
          '/reset-password',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
