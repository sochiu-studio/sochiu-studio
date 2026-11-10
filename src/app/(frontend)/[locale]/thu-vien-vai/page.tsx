import type { Metadata } from 'next'

import { FabricLibrary, type FabricItem } from '@/components/site/FabricLibrary'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { toPic } from '@/lib/media'
import { getClient } from '@/lib/payload'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'en' ? 'Sofa fabric & leather library' : 'Thư viện chất liệu vải & da sofa',
    alternates: { canonical: href(locale, 'fabrics'), languages: { vi: href('vi', 'fabrics'), en: href('en', 'fabrics') } },
  }
}

export default async function FabricsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = dict(locale)
  const payload = await getClient()
  const [{ docs }, { docs: vi }] = await Promise.all([
    payload.find({ collection: 'fabrics', locale, sort: 'order', limit: 1000, depth: 1 }),
    // leather or fabric from the Vietnamese line ("Da …"), whatever the page's language
    payload.find({ collection: 'fabrics', locale: 'vi', limit: 1000, depth: 0, select: { line: true } }),
  ])
  const leather = new Set(vi.filter((f) => /^da\b/i.test(f.line || '')).map((f) => f.id))
  const items: FabricItem[] = docs.map((f) => ({
    id: f.id,
    name: f.name,
    code: f.code,
    line: f.line || '',
    leather: leather.has(f.id),
    intro: f.intro,
    suitableFor: f.suitableFor,
    specs: f.specs,
    thumb: toPic(f.thumbnail ?? f.swatch, f.name, 'thumb'),
    large: toPic(f.swatch, f.name, 'card'),
  }))
  return (
    <>
      <h1 className="sc-visually-hidden">{t.fabrics.title}</h1>
      <FabricLibrary items={items} t={t} />
    </>
  )
}
