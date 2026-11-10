import type { MetadataRoute } from 'next'

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://sochiustudio.com').replace(/\/$/, '')

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
