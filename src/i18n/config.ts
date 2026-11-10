export const locales = ['vi', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'vi'

export const isLocale = (v: string | undefined): v is Locale => locales.includes(v as Locale)

/**
 * The site's named pages and their URL in each language - the old WordPress URLs, kept for
 * search engines and shared links. Pages live under app/(frontend)/[locale]/<vi path>; the
 * proxy maps an English path onto the Vietnamese folder.
 */
export const routes = {
  home: { vi: '/', en: '/' },
  shop: { vi: '/cua-hang', en: '/shop' },
  collections: { vi: '/bo-suu-tap', en: '/collections' },
  about: { vi: '/ve-chung-toi', en: '/about-us' },
  inspiration: { vi: '/review-tu-khach-hang', en: '/inspiration' },
  fabrics: { vi: '/thu-vien-vai', en: '/fabric-library' },
  blog: { vi: '/blogs', en: '/blogs' },
  announcements: { vi: '/thong-bao', en: '/announcements' },
  faq: { vi: '/faq', en: '/faq' },
  showroom: { vi: '/showroom', en: '/showroom' },
  contact: { vi: '/lien-he', en: '/contact' },
  support: { vi: '/trung-tam-ho-tro-khach-hang', en: '/customer-support-center' },
} as const satisfies Record<string, Record<Locale, string>>

export type RouteName = keyof typeof routes

/** Content pages served by /[slug] with their own slug per language (not proxied). */
export const pageSlugs = {
  policies: { vi: 'chinh-sach-mua-hang-van-chuyen-doi-tra-bao-hanh', en: 'purchase-shipping-return-and-warranty-policies' },
} as const
export const pageHref = (locale: Locale, name: keyof typeof pageSlugs) => withLocale(locale, `/${pageSlugs[name][locale]}`)
export const collectionHref = (locale: Locale, slug: string) => withLocale(locale, `/bo-suu-tap/${slug}`)

/** "/cua-hang/" in Vietnamese, "/en/shop/" in English. Trailing slash like the old site. */
export function href(locale: Locale, name: RouteName, ...rest: string[]): string {
  const base = routes[name][locale]
  const path = [base === '/' ? '' : base, ...rest.map(encodeURIComponent)].join('/')
  return withLocale(locale, path)
}

/** Prefix a site path with /en for English; "/" stays the home page. */
export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  const slashed = clean === '/' ? '/' : clean.endsWith('/') ? clean : `${clean}/`
  return locale === defaultLocale ? slashed : `/en${slashed === '/' ? '/' : slashed}`
}

export const productHref = (locale: Locale, slug: string) => withLocale(locale, `/san-pham/${slug}`)
export const categoryHref = (locale: Locale, slug: string) => withLocale(locale, `/danh-muc-san-pham/${slug}`)
export const postHref = (locale: Locale, slug: string) => withLocale(locale, `/${slug}`)
export const postCategoryHref = (locale: Locale, slug: string) => withLocale(locale, `/category/${slug}`)

/** The same page in the other language, from either its public URL ("/en/shop/") or the
 *  internal one ("/vi/cua-hang/"). Posts have their own slug per language: those pages pass
 *  their translation explicitly; here an unknown path keeps its words. */
export function translatePath(path: string, to: Locale): string {
  let from: Locale = defaultLocale
  let rest = path || '/'
  const m = rest.match(/^\/(vi|en)(\/.*|$)/)
  if (m) {
    from = m[1] as Locale
    rest = m[2] || '/'
  }
  if (from !== to) {
    for (const r of Object.values(routes)) {
      const base = r[from]
      if (base !== '/' && (rest === base || rest.startsWith(`${base}/`))) {
        rest = r[to] + rest.slice(base.length)
        break
      }
    }
  }
  return withLocale(to, rest)
}
