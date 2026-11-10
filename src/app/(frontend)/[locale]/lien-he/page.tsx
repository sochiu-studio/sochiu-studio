import type { Metadata } from 'next'

import { SupportCenter } from '@/components/site/SupportCenter'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Contact' : 'Liên hệ',
    alternates: { canonical: href(locale, 'contact'), languages: { vi: href('vi', 'contact'), en: href('en', 'contact') } },
    description: dict(locale).support.title,
  }
}

// the old contact page was empty: the support center's ways to reach the team
export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  return <SupportCenter locale={locale} />
}
