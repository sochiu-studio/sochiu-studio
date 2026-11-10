import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { type ShopParams, ShopListing } from '@/components/site/ShopListing'
import { categoryHref, type Locale } from '@/i18n/config'
import { getClient } from '@/lib/payload'

type Params = Promise<{ locale: Locale; slug: string }>

const getCategory = cache(async (locale: Locale, slug: string) => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'product-categories',
    locale,
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const c = await getCategory(locale, slug)
  if (!c) return {}
  const payload = await getClient()
  const other = await payload.findByID({ collection: 'product-categories', id: c.id, locale: locale === 'vi' ? 'en' : 'vi', depth: 0 })
  const vi = locale === 'vi' ? c.slug : other.slug
  const en = locale === 'en' ? c.slug : other.slug
  return {
    title: c.meta?.title || c.title,
    description: c.meta?.description || c.description || undefined,
    alternates: { canonical: categoryHref(locale, c.slug || ''), languages: { vi: categoryHref('vi', vi || ''), en: categoryHref('en', en || '') } },
  }
}

export default async function CategoryPage({ params, searchParams }: { params: Params; searchParams: Promise<ShopParams> }) {
  const [{ locale, slug }, query] = await Promise.all([params, searchParams])
  const category = await getCategory(locale, slug)
  if (!category) notFound()
  return <ShopListing locale={locale} category={category} params={query} />
}
