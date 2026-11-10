import { NextResponse, type NextRequest } from 'next/server'

import { defaultLocale, routes } from './i18n/config'

/**
 * Vietnamese at the root ("/cua-hang/"), English under "/en/" with its own words
 * ("/en/shop/") - the old WordPress URLs. Internally every page lives at /[locale]/<vi path>:
 * root paths are rewritten to /vi/..., English route names to their Vietnamese folder.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  // a plain URL: NextURL would drop the trailing slash again (no `trailingSlash` in next.config,
  // which the admin doesn't support)
  const redirect = (to: string) => NextResponse.redirect(new URL(`${to}${req.nextUrl.search}`, req.url), 308)

  // the old site's URLs end in "/"; keep one form of each page
  if (!pathname.endsWith('/')) return redirect(`${pathname}/`)

  // /vi/... is the root; never two spellings of a page
  if (pathname === `/${defaultLocale}/` || pathname.startsWith(`/${defaultLocale}/`)) {
    return redirect(pathname.slice(defaultLocale.length + 1) || '/')
  }

  // old blog-category links from the home page's tiles
  const oldCategory = pathname.match(/^(\/en)?\/category\/blog\/([^/]+)\/$/)
  if (oldCategory) {
    const slug = oldCategory[2] === 'tu-van-chon-sofa' ? 'tu-van-chon-noi-that' : oldCategory[2]
    return redirect(`${oldCategory[1] ?? ''}/category/${slug}/`)
  }

  const english = pathname === '/en/' || pathname.startsWith('/en/')
  let rest = english ? pathname.slice(3) : pathname
  if (english) {
    for (const r of Object.values(routes)) {
      if (r.en !== '/' && (rest === `${r.en}/` || rest.startsWith(`${r.en}/`))) {
        rest = r.vi + rest.slice(r.en.length)
        break
      }
    }
  }
  const url = req.nextUrl.clone()
  url.pathname = `/${english ? 'en' : defaultLocale}${rest}`
  return NextResponse.rewrite(url)
}

export const config = {
  // everything but the admin, the API, Next's own files and files with an extension
  matcher: ['/((?!admin|api|_next|.*\\.[\\w]+$).*)'],
}
