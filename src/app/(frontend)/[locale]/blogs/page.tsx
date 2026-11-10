import type { Metadata } from 'next'

import { PostList } from '@/components/site/PostList'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return { title: 'Blogs', alternates: { canonical: href(locale, 'blog'), languages: { vi: href('vi', 'blog'), en: href('en', 'blog') } } }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return <PostList locale={locale} title={dict(locale).blog.title} />
}
