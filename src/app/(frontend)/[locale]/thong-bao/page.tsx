import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PostList } from '@/components/site/PostList'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getClient } from '@/lib/payload'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: dict(locale).blog.announcements,
    alternates: { canonical: href(locale, 'announcements'), languages: { vi: href('vi', 'announcements'), en: href('en', 'announcements') } },
  }
}

export default async function AnnouncementsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'post-categories', locale: 'vi', where: { slug: { equals: 'thong-bao' } }, limit: 1, depth: 0 })
  if (!docs[0]) notFound()
  const category = await payload.findByID({ collection: 'post-categories', id: docs[0].id, locale, depth: 0 })
  return <PostList locale={locale} category={category} title={dict(locale).blog.announcements} />
}
