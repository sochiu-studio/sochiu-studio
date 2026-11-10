import type { MetadataRoute } from 'next'

import { categoryHref, collectionHref, href, locales, postCategoryHref, postHref, routes, withLocale } from '@/i18n/config'
import { getClient } from '@/lib/payload'

export const revalidate = 3600

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://sochiustudio.com').replace(/\/$/, '')

/** Every public page in both languages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getClient()
  const entries: MetadataRoute.Sitemap = []
  const add = (path: string, lastModified?: string | null) =>
    entries.push({ url: `${SITE}${path}`, lastModified: lastModified ? new Date(lastModified) : undefined })

  for (const locale of locales) {
    for (const name of ['home', 'shop', 'collections', 'about', 'inspiration', 'fabrics', 'blog', 'announcements', 'faq', 'showroom', 'support'] as const)
      add(href(locale, name))

    const [products, categories, collections, posts, postCategories, pages] = await Promise.all([
      payload.find({ collection: 'products', locale, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'product-categories', locale, limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'product-collections', locale, limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'posts', locale, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'post-categories', locale, limit: 100, depth: 0, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'pages', locale, limit: 200, depth: 0, select: { slug: true, updatedAt: true } }),
    ])
    for (const d of products.docs) add(withLocale(locale, `/san-pham/${d.slug}`), d.updatedAt)
    for (const d of categories.docs) add(categoryHref(locale, d.slug || ''), d.updatedAt)
    for (const d of collections.docs) add(collectionHref(locale, d.slug || ''), d.updatedAt)
    for (const d of posts.docs) add(postHref(locale, d.slug || ''), d.updatedAt)
    for (const d of postCategories.docs) add(postCategoryHref(locale, d.slug || ''), d.updatedAt)
    // pages with a folder of their own are listed above under their route
    const routed = new Set<string>(Object.values(routes).flatMap((r) => [r.vi, r.en].map((p) => p.replace(/^\//, ''))))
    for (const d of pages.docs) if (d.slug && !routed.has(d.slug)) add(withLocale(locale, `/${d.slug}`), d.updatedAt)
  }
  return entries
}
