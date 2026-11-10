'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'

// not-found gets no params; reading request headers here would make every page dynamic.
// The address says the language: /en/… is English.
export default function NotFound() {
  const pathname = usePathname() || '/'
  const locale: Locale = /^\/en(\/|$)/.test(pathname) ? 'en' : 'vi'
  const t = dict(locale)
  return (
    <div className="sc-notfound">
      <h1>{t.notFound.title}</h1>
      <p>{t.notFound.text}</p>
      <div>
        <Link href={href(locale, 'home')} className="sc-btn sc-btn--dark">
          {t.notFound.home}
        </Link>
        <Link href={href(locale, 'shop')} className="sc-btn sc-btn--light" style={{ border: 'var(--rule)' }}>
          {t.notFound.shop}
        </Link>
      </div>
    </div>
  )
}
