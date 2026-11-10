import Link from 'next/link'

import { href, type Locale, pageHref } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getClient } from '@/lib/payload'

import { InquiryButton } from './InquiryButton'

/** Hotline, Zalo, the 1:1 request form and quick links (also /lien-he/). */
export async function SupportCenter({ locale }: { locale: Locale }) {
  const t = dict(locale)
  const payload = await getClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', locale, depth: 0 })
  const hours = settings.showrooms?.[0]?.hours?.split('\n') || []
  const phone = (settings.hotline || '').replace(/\D/g, '')
  return (
    <div className="sc-support">
      <h1 className="sc-visually-hidden">{t.support.title}</h1>
      <section className="sc-support__hotline">
        <h2>{t.support.hotline}</h2>
        <a href={`tel:${phone}`} className="sc-support__phone">
          {phone.replace(/^(\d{5})(\d+)$/, '$1 $2')}
        </a>
        <p>
          <strong>{t.support.open}</strong>
        </p>
        {hours.map((h) => (
          <p key={h}>{h}</p>
        ))}
      </section>
      <div className="sc-support__cards">
        <section>
          <h2>{t.support.chat}</h2>
          <p>{t.support.chatText}</p>
          {settings.socials?.zalo && (
            <a href={settings.socials.zalo} target="_blank" rel="noopener noreferrer" className="sc-btn sc-btn--dark">
              {t.support.chatButton}
            </a>
          )}
        </section>
        <section>
          <h2>{t.support.qa}</h2>
          <p>{t.support.qaText}</p>
          <InquiryButton t={t} label={t.support.qaButton} />
        </section>
        <section>
          <h2>{t.support.links}</h2>
          <ul className="sc-support__links">
            <li>
              <Link href={href(locale, 'faq')}>{t.nav.faq}</Link>
            </li>
            <li>
              <Link href={href(locale, 'announcements')}>{t.nav.announcements}</Link>
            </li>
            <li>
              <Link href={pageHref(locale, 'policies')}>{t.support.policies}</Link>
            </li>
            <li>
              <Link href={href(locale, 'showroom')}>{t.support.store}</Link>
            </li>
            <li>
              <Link href={href(locale, 'shop')}>{t.support.order}</Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
