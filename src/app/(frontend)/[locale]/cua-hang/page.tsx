import type { Metadata } from 'next'

import { type ShopParams, ShopListing } from '@/components/site/ShopListing'
import { href, type Locale } from '@/i18n/config'

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Shop sofas & made-to-order furniture' : 'Cửa hàng sofa & nội thất may đo',
    alternates: { canonical: href(locale, 'shop'), languages: { vi: href('vi', 'shop'), en: href('en', 'shop') } },
  }
}

export default async function ShopPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<ShopParams> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams])
  return <ShopListing locale={locale} params={query} />
}
