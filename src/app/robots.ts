import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site-url'

const SITE = siteUrl

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
