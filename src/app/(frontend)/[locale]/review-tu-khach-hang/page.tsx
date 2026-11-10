import type { Metadata } from 'next'

import { InspirationGallery, type ReviewItem } from '@/components/site/InspirationGallery'
import { href, type Locale, productHref } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { toPic } from '@/lib/media'
import { getClient } from '@/lib/payload'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Inspiration from real homes' : 'Nguồn cảm hứng từ không gian sống',
    alternates: { canonical: href(locale, 'inspiration'), languages: { vi: href('vi', 'inspiration'), en: href('en', 'inspiration') } },
  }
}

export default async function InspirationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = dict(locale)
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'reviews', locale, sort: '-date', limit: 500, depth: 2 })
  const items: ReviewItem[] = docs.map((r) => {
    const product = typeof r.product === 'object' && r.product ? r.product : null
    return {
      id: r.id,
      title: r.title,
      customer: r.customerName || t.inspiration.customer,
      location: r.location,
      date: r.date,
      content: r.content,
      images: (r.images || []).map((m) => toPic(m, r.title, 'card')).filter((x) => x !== null),
      product: product
        ? { title: product.title, href: productHref(locale, product.slug || ''), thumb: toPic(product.images?.[0], product.title, 'thumb') }
        : r.productName
          ? { title: r.productName, href: null, thumb: toPic(r.images?.[0], r.productName, 'thumb') }
          : null,
    }
  })
  return <InspirationGallery items={items} t={t} />
}
