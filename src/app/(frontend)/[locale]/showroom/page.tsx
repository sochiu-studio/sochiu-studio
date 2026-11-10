import type { Metadata } from 'next'

import { Img } from '@/components/site/Img'
import { InquiryButton } from '@/components/site/InquiryButton'
import { RichText } from '@/components/site/RichText'
import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getPage } from '@/lib/pages'
import { getClient } from '@/lib/payload'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  const page = await getPage('showroom', locale)
  return {
    title: page?.meta?.title || page?.title || 'Showroom',
    alternates: { canonical: href(locale, 'showroom'), languages: { vi: href('vi', 'showroom'), en: href('en', 'showroom') } },
  }
}

export default async function ShowroomPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = dict(locale)
  const payload = await getClient()
  const [page, settings] = await Promise.all([getPage('showroom', locale), payload.findGlobal({ slug: 'site-settings', locale, depth: 1 })])
  const s = settings.showrooms?.[0]
  return (
    <div className="sc-showroom">
      <div className="sc-showroom__map">
        {s?.mapEmbed ? (
          <iframe src={s.mapEmbed} title={s.name || 'Showroom'} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        ) : (
          <Img media={page?.hero} sizes="60vw" size="large" />
        )}
      </div>
      <div className="sc-showroom__body">
        <h1>{page?.title || s?.name}</h1>
        {s?.address && (
          <p>
            <strong>{t.showroom.address}</strong> {s.address}
          </p>
        )}
        {s?.hours && (
          <div>
            <strong>{t.showroom.hours}</strong>
            {s.hours.split('\n').map((l) => (
              <p key={l}>• {l}</p>
            ))}
          </div>
        )}
        {page?.hero && s?.mapEmbed && <Img media={page.hero} sizes="(max-width: 767px) 100vw, 30vw" className="sc-showroom__img" />}
        <RichText data={page?.content} />
        <InquiryButton t={t} label={t.showroom.book} tab="visit" />
      </div>
    </div>
  )
}
