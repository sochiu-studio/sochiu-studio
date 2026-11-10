import Link from 'next/link'

import { href, type Locale } from '@/i18n/config'
import type { Dict } from '@/i18n/dict'
import type { SiteSetting } from '@/payload-types'

import { FacebookIcon, InstagramIcon, MessengerIcon, TiktokIcon, ZaloIcon } from './Icons'

const digits = (n?: string | null) => (n || '').replace(/\D/g, '')
/** 0878888555 -> 087.8888.555, as printed on the old site */
const prettyPhone = (n?: string | null) => {
  const d = digits(n)
  return d.length === 10 ? `${d.slice(0, 3)}.${d.slice(3, 7)}.${d.slice(7)}` : n || ''
}

/**
 * Three columns on one top line - the brand, the hotline, the showroom - with the same steps of
 * type in the last two (label, one large light line, a muted line, links), and the fine print.
 * Navigation lives in the header.
 */
export function Footer({ locale, t, settings }: { locale: Locale; t: Dict; settings: SiteSetting }) {
  const showroom = settings.showrooms?.[0]
  const s = settings.socials || {}
  const channels = [
    { href: s.zalo, label: 'Zalo', icon: <ZaloIcon /> },
    { href: s.messenger, label: 'Messenger', icon: <MessengerIcon /> },
    { href: s.facebook, label: 'Facebook', icon: <FacebookIcon /> },
    { href: s.instagram, label: 'Instagram', icon: <InstagramIcon /> },
    { href: s.tiktok, label: 'TikTok', icon: <TiktokIcon /> },
  ].filter((x): x is typeof x & { href: string } => Boolean(x.href))

  return (
    <footer className="sc-footer">
      <div className="sc-footer__grid">
        <div className="sc-footer__brand">
          <Link href={href(locale, 'home')} aria-label="Sochiu Studio" className="sc-footer__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="Sochiu Studio" width={649} height={49} loading="lazy" />
          </Link>
          <p className="sc-footer__tagline">{settings.footerAbout || t.footer.tagline}</p>
        </div>

        <div className="sc-footer__contact">
          <span className="sc-footer__label">{t.footer.hotline}</span>
          {settings.hotline && (
            <a className="sc-footer__primary sc-footer__phone" href={`tel:${digits(settings.hotline)}`}>
              {prettyPhone(settings.hotline)}
            </a>
          )}
          {channels.length > 0 && (
            <ul className="sc-footer__channels" aria-label={t.footer.follow}>
              {channels.map((c) => (
                <li key={c.label}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer" aria-label={c.label} title={c.label}>
                    {c.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showroom && (
          <section className="sc-footer__showroom">
            <div className="sc-footer__showroom-body">
              <span className="sc-footer__label">{t.footer.showroom}</span>
              {showroom.address && <p className="sc-footer__primary sc-footer__address">{showroom.address}</p>}
              {showroom.hours && (
                <p className="sc-footer__hours">
                  {showroom.hours.split('\n').map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </p>
              )}
              <p className="sc-footer__showroom-links">
                <Link href={href(locale, 'showroom')}>{t.footer.showroomButton} →</Link>
                {showroom.mapUrl && (
                  <a href={showroom.mapUrl} target="_blank" rel="noopener noreferrer">
                    {t.footer.directions} ↗
                  </a>
                )}
              </p>
            </div>
          </section>
        )}
      </div>

      <div className="sc-footer__bottom">
        {settings.businessInfo && (
          <ul className="sc-footer__legal">
            {settings.businessInfo
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)
              .map((l, i) => (
                <li key={i}>{l}</li>
              ))}
          </ul>
        )}
        <p className="sc-footer__rights">{t.footer.rights}</p>
      </div>
    </footer>
  )
}
