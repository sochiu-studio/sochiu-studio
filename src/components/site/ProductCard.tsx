import Link from 'next/link'

import { type Locale, productHref } from '@/i18n/config'
import type { Dict } from '@/i18n/dict'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/payload-types'

import { Img } from './Img'

export type CardProduct = Pick<Product, 'id' | 'title' | 'slug' | 'images' | 'priceFrom'>

const SIZES = '(max-width: 767px) 75vw, (max-width: 1024px) 45vw, 33vw'

/** Picture (the second one shows on hover), name in capitals, "Từ 13.500.000 ₫". */
export function ProductCard({ product, locale, t }: { product: CardProduct; locale: Locale; t: Dict }) {
  const [first, second] = product.images || []
  return (
    <Link href={productHref(locale, product.slug || '')} className="sc-card">
      <div className="sc-card__media">
        <Img media={first} sizes={SIZES} className="sc-card__img" alt={product.title} />
        {second && <Img media={second} sizes={SIZES} className="sc-card__img sc-card__img--hover" alt="" />}
      </div>
      <div className="sc-card__body">
        <h3 className="sc-card__title">{product.title}</h3>
        <p className="sc-card__price">
          {product.priceFrom ? (
            <>
              {t.product.from} {formatPrice(product.priceFrom)}
            </>
          ) : (
            t.product.contact
          )}
        </p>
      </div>
    </Link>
  )
}
