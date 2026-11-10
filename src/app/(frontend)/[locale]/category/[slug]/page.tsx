import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { PostList } from '@/components/site/PostList'
import { type Locale, locales, postCategoryHref } from '@/i18n/config'
import { getClient } from '@/lib/payload'

export const revalidate = 300

type Params = Promise<{ locale: Locale; slug: string }>

const getCategory = cache(async (locale: Locale, slug: string) => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'post-categories',
    locale,
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
})

export async function generateStaticParams() {
  const payload = await getClient()
  const out: { locale: Locale; slug: string }[] = []
  for (const locale of locales) {
    const { docs } = await payload.find({ collection: 'post-categories', locale, limit: 100, depth: 0, select: { slug: true } })
    for (const d of docs) if (d.slug) out.push({ locale, slug: d.slug })
  }
  return out
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const c = await getCategory(locale, slug)
  return c ? { title: c.title, alternates: { canonical: postCategoryHref(locale, c.slug || '') } } : {}
}

export default async function PostCategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  const category = await getCategory(locale, slug)
  if (!category) notFound()
  return <PostList locale={locale} category={category} title={category.title} />
}
