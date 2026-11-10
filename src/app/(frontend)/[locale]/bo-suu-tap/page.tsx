import type { Metadata } from 'next'
import Link from 'next/link'

import { Img } from '@/components/site/Img'
import { collectionHref, href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getPage } from '@/lib/pages'
import { getClient } from '@/lib/payload'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Furniture & made-to-order sofa collections' : 'Bộ sưu tập nội thất & sofa may đo',
    alternates: { canonical: href(locale, 'collections'), languages: { vi: href('vi', 'collections'), en: href('en', 'collections') } },
  }
}

export default async function CollectionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = dict(locale)
  const payload = await getClient()
  const [page, { docs }] = await Promise.all([
    getPage('bo-suu-tap', locale),
    payload.find({ collection: 'product-collections', locale, sort: 'order', limit: 100, depth: 1 }),
  ])
  return (
    <>
      <h1 className="sc-visually-hidden">{t.collections.title}</h1>
      {page?.hero && (
        <div className="sc-collections__hero">
          <Img media={page.hero} sizes="100vw" size="large" priority />
        </div>
      )}
      <div className="sc-collections">
        {docs.map((c) => (
          <Link key={c.id} href={collectionHref(locale, c.slug || '')} className="sc-collection-card">
            <div className="sc-collection-card__media">
              <Img media={c.cover} sizes="(max-width: 767px) 100vw, 33vw" alt={c.title} />
            </div>
            <h2>{c.title}</h2>
            <p>{t.collections.by}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
