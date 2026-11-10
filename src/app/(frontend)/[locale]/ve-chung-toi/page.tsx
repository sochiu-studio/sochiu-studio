import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageBody } from '@/components/site/PageBody'
import { href, type Locale } from '@/i18n/config'
import { getPage } from '@/lib/pages'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  const page = await getPage('ve-chung-toi', locale)
  return {
    title: page?.meta?.title || page?.title,
    description: page?.meta?.description || undefined,
    alternates: { canonical: href(locale, 'about'), languages: { vi: href('vi', 'about'), en: href('en', 'about') } },
  }
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const page = await getPage('ve-chung-toi', locale)
  if (!page) notFound()
  return <PageBody page={page} locale={locale} />
}
