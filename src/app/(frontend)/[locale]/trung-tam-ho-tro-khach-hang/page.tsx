import type { Metadata } from 'next'

import { SupportCenter } from '@/components/site/SupportCenter'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: dict(locale).support.title,
    alternates: { canonical: href(locale, 'support'), languages: { vi: href('vi', 'support'), en: href('en', 'support') } },
  }
}

export default async function SupportPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return <SupportCenter locale={locale} />
}
