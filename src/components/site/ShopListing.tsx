import type { Where } from 'payload'

import { categoryHref, href, type Locale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getClient } from '@/lib/payload'
import type { ProductCategory } from '@/payload-types'

import { LoadMore } from './LoadMore'
import { ProductCard } from './ProductCard'
import { ShopToolbar } from './ShopToolbar'

export type ShopParams = { sc_filter?: string; orderby?: string; s?: string }

const FILTERS = ['on_sale', 'fabric', 'leather', 'wood'] as const
const SORTS = { date: '-wpId', 'date-asc': 'wpId', price: 'priceFrom', 'price-desc': '-priceFrom' } as const

/** The grid of /cua-hang/ and of every /danh-muc-san-pham/<slug>/, with the old shop's
 *  ?sc_filter= and ?orderby= parameters. */
export async function ShopListing({ locale, category, params }: { locale: Locale; category?: ProductCategory; params: ShopParams }) {
  const t = dict(locale)
  const payload = await getClient()
  const filter = FILTERS.find((f) => f === params.sc_filter)
  const sort = (Object.keys(SORTS) as (keyof typeof SORTS)[]).find((s) => s === params.orderby)
  const search = (params.s || '').trim().slice(0, 80)

  const and: Where[] = []
  if (category) and.push({ category: { in: [category.id] } })
  if (filter === 'on_sale') and.push({ 'variants.salePrice': { greater_than: 0 } })
  else if (filter) and.push({ materials: { contains: filter } })
  if (search) and.push({ title: { like: search } })

  const [categories, products] = await Promise.all([
    payload.find({ collection: 'product-categories', locale, sort: 'order', limit: 50, depth: 0 }),
    payload.find({
      collection: 'products',
      locale,
      where: and.length ? { and } : undefined,
      sort: SORTS[sort ?? 'date'],
      limit: 500,
      depth: 1,
      select: { title: true, slug: true, images: true, priceFrom: true },
    }),
  ])

  const base = category ? categoryHref(locale, category.slug || '') : href(locale, 'shop')
  const link = (next: ShopParams) => {
    const q = new URLSearchParams()
    const merged = { sc_filter: filter, orderby: sort, s: search || undefined, ...next }
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v)
    const qs = q.toString()
    return qs ? `${base}?${qs}` : base
  }
  const keep = (path: string) => {
    const q = new URLSearchParams()
    if (filter) q.set('sc_filter', filter)
    if (sort) q.set('orderby', sort)
    return q.size ? `${path}?${q}` : path
  }

  return (
    <div className="sc-shop">
      <h1 className="sc-visually-hidden">{category?.title ?? t.shop.title}</h1>
      <ShopToolbar
        categories={[
          { label: t.shop.all, href: keep(href(locale, 'shop')), active: !category },
          ...categories.docs.map((c) => ({ label: c.title, href: keep(categoryHref(locale, c.slug || '')), active: c.id === category?.id })),
        ]}
        menus={[
          {
            label: t.shop.filter,
            items: FILTERS.map((f) => ({ label: t.shop.filters[f], href: link({ sc_filter: f }), active: f === filter })),
            clear: { label: t.shop.clearFilter, href: link({ sc_filter: undefined }) },
          },
          {
            label: t.shop.sort,
            items: (Object.keys(SORTS) as (keyof typeof SORTS)[]).map((s) => ({
              label: t.shop.sorts[s],
              href: link({ orderby: s }),
              active: s === (sort ?? 'date'),
            })),
            clear: { label: t.shop.clearSort, href: link({ orderby: undefined }) },
          },
        ]}
      />
      {search && (
        <p className="sc-shop__search">
          {t.shop.search} “{search}”
        </p>
      )}
      {products.docs.length ? (
        <LoadMore
          key={`${filter}-${sort}-${search}`}
          className="sc-shop__grid"
          label={t.shop.more}
          items={products.docs.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} t={t} />
          ))}
        />
      ) : (
        <p className="sc-shop__empty">{t.shop.empty}</p>
      )}
    </div>
  )
}
