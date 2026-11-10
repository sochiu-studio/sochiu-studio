'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { href, type Locale, translatePath } from '@/i18n/config'
import type { Dict } from '@/i18n/dict'

import { useAlternate } from './Alternate'
import { ChevronDown, CloseIcon, MenuIcon, SearchIcon } from './Icons'

type Props = { locale: Locale; t: Dict }

export function Header({ locale, t }: Props) {
  const alternate = useAlternate()
  const pathname = usePathname() || '/'
  const isHome = /^\/(vi|en)?\/?$/.test(pathname)
  const [scrolled, setScrolled] = useState(false)
  // the menu is open on the page it was opened on: following a link closes it
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (fn: (o: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null)
  const [searchOn, setSearchOn] = useState<string | null>(null)
  const searching = searchOn === pathname

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  const about = [
    { label: t.nav.announcements, to: href(locale, 'announcements') },
    { label: t.nav.faq, to: href(locale, 'faq') },
    { label: t.nav.blog, to: href(locale, 'blog') },
    { label: t.nav.showroom, to: href(locale, 'showroom') },
  ]
  const items = [
    { label: t.nav.shop, to: href(locale, 'shop') },
    { label: t.nav.collections, to: href(locale, 'collections') },
    { label: t.nav.about, to: href(locale, 'about'), children: about },
    { label: t.nav.inspiration, to: href(locale, 'inspiration') },
    { label: t.nav.fabrics, to: href(locale, 'fabrics') },
  ]
  const switchTo = (l: Locale) => (l === locale ? undefined : (alternate ?? translatePath(pathname, l)))

  const langs = (
    <span className="sc-langs">
      {(['vi', 'en'] as const).map((l, i) => (
        <span key={l}>
          {i > 0 && <span className="sc-langs__sep">|</span>}
          {l === locale ? (
            <span className="sc-langs__current" aria-current="true">
              {l === 'vi' ? 'VN' : 'EN'}
            </span>
          ) : (
            <Link href={switchTo(l)!} hrefLang={l} lang={l}>
              <span className="sc-skew">{l === 'vi' ? 'VN' : 'EN'}</span>
            </Link>
          )}
        </span>
      ))}
    </span>
  )

  return (
    <header className={`sc-header${isHome ? ' sc-header--overlay' : ''}${scrolled || open ? ' is-solid' : ''}`}>
      <div className="sc-header__bar">
        <button className="sc-header__burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? t.header.close : t.header.menu}>
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
        <Link href={href(locale, 'home')} className="sc-header__logo" aria-label="Sochiu Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Sochiu Studio" width={649} height={49} />
        </Link>
        <nav className="sc-nav" aria-label="Menu">
          <ul>
            {items.map((it) => (
              <li key={it.to} className={it.children ? 'has-sub' : undefined}>
                <Link href={it.to}>
                  <span className="sc-skew">{it.label}</span>
                </Link>
                {it.children && (
                  <ul className="sc-nav__sub">
                    {it.children.map((c) => (
                      <li key={c.to}>
                        <Link href={c.to}>{c.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="sc-header__tools">
          {langs}
          <button className="sc-header__icon" onClick={() => setSearchOn(searching ? null : pathname)} aria-expanded={searching} aria-label={t.header.search}>
            {searching ? <CloseIcon /> : <SearchIcon />}
          </button>
        </div>
      </div>

      {searching && (
        // a plain GET form: the shop reads ?s= (works without JavaScript too)
        <form action={href(locale, 'shop')} className="sc-search" role="search">
          <SearchIcon />
          <input name="s" autoFocus placeholder={t.header.searchPlaceholder} aria-label={t.header.search} />
        </form>
      )}
      <div className={`sc-drawer${open ? ' is-open' : ''}`} hidden={!open}>
        <ul>
          {items.map((it) => (
            <li key={it.to}>
              {it.children ? (
                <details>
                  <summary>
                    {it.label}
                    <ChevronDown />
                  </summary>
                  <ul>
                    <li>
                      <Link href={it.to}>{it.label}</Link>
                    </li>
                    {it.children.map((c) => (
                      <li key={c.to}>
                        <Link href={c.to}>{c.label}</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <Link href={it.to}>{it.label}</Link>
              )}
            </li>
          ))}
          <li className="sc-drawer__row">
            <Link href={switchTo('vi') ?? '#'} aria-current={locale === 'vi' ? 'true' : undefined}>
              VN
            </Link>
            <span>/</span>
            <Link href={switchTo('en') ?? '#'} aria-current={locale === 'en' ? 'true' : undefined}>
              EN
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
