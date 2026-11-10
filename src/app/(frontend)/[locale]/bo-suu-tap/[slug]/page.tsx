import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { Img } from '@/components/site/Img'
import { ProductCard } from '@/components/site/ProductCard'
import { collectionHref, type Locale, locales } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { asMedia } from '@/lib/media'
import { getClient } from '@/lib/payload'
import type { Product } from '@/payload-types'

export const revalidate = 300

type Params = Promise<{ locale: Locale; slug: string }>

const getCollection = cache(async (locale: Locale, slug: string) => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'product-collections',
    locale,
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
})

export async function generateStaticParams() {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'product-collections', limit: 100, depth: 0, select: { slug: true } })
  return locales.flatMap((locale) => docs.map((d) => ({ locale, slug: d.slug || '' })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const c = await getCollection(locale, slug)
  if (!c) return {}
  const image = asMedia(c.meta?.image) ?? asMedia(c.cover)
  return {
    title: c.meta?.title || `${dict(locale).collections.prefix} ${c.title}`,
    description: c.meta?.description || c.tagline || undefined,
    alternates: { canonical: collectionHref(locale, c.slug || ''), languages: { vi: collectionHref('vi', c.slug || ''), en: collectionHref('en', c.slug || '') } },
    openGraph: image?.url ? { images: [{ url: image.sizes?.large?.url || image.url }] } : undefined,
  }
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  const t = dict(locale)
  const c = await getCollection(locale, slug)
  if (!c) notFound()
  const products = (c.products || []).filter((p): p is Product => typeof p === 'object')
  return (
    <div className="sc-collection">
      <div className="sc-collection__head">
        <h1>
          {t.collections.prefix} {c.title}
        </h1>
        <p>{t.collections.products}</p>
      </div>
      {products.length > 0 && (
        <div className="sc-shop__grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} t={t} />
          ))}
        </div>
      )}
      {(c.tagline || c.description) && (
        <div className="sc-article sc-collection__story">
          {c.tagline && <h2>{c.tagline}</h2>}
          {c.description?.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {(c.gallery || []).map((m, i) => (
        <Img key={i} media={m} sizes="100vw" size="large" className="sc-collection__image" />
      ))}
    </div>
  )
}
