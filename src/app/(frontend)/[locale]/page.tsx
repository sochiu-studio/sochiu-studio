import type { Metadata } from 'next'
import Link from 'next/link'

import { Carousel } from '@/components/site/Carousel'
import { HeroSlider } from '@/components/site/HeroSlider'
import { Img } from '@/components/site/Img'
import { ProductCard } from '@/components/site/ProductCard'
import { ProductTabs } from '@/components/site/ProductTabs'
import { href, type Locale, postCategoryHref, withLocale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { asMedia } from '@/lib/media'
import { getClient } from '@/lib/payload'
import type { PostCategory, ProductCategory } from '@/payload-types'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  return {
    title: { absolute: locale === 'en' ? 'Home - Sochiu Studio' : 'Trang chủ - Sochiu Studio' },
    alternates: { canonical: withLocale(locale, '/'), languages: { vi: '/', en: '/en/' } },
  }
}

const link = (locale: Locale, url?: string | null) => (url ? (url.startsWith('http') ? url : withLocale(locale, url)) : null)

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = dict(locale)
  const payload = await getClient()

  const [home, allCategories, reviews] = await Promise.all([
    payload.findGlobal({ slug: 'home-page', locale, depth: 2 }),
    payload.find({ collection: 'product-categories', locale, sort: 'order', limit: 50, depth: 0 }),
    payload.find({ collection: 'reviews', locale, sort: '-date', limit: 10, depth: 1 }),
  ])
  const tabCategories = (home.productTabs?.length ? home.productTabs : allCategories.docs).filter(
    (c): c is ProductCategory => typeof c === 'object',
  )
  // one query for every tab's products, newest first like the old site
  const products = await payload.find({
    collection: 'products',
    locale,
    where: { category: { in: tabCategories.map((c) => c.id) } },
    sort: '-wpId',
    limit: 200,
    depth: 1,
    select: { title: true, slug: true, images: true, priceFrom: true, category: true },
  })
  const tabs = tabCategories.map((c) => ({
    id: c.id,
    label: c.title,
    cards: products.docs
      .filter((p) => (p.category || []).some((x) => (typeof x === 'object' ? x.id : x) === c.id))
      .map((p) => <ProductCard key={p.id} product={p} locale={locale} t={t} />),
  }))

  const slides = (home.slides || []).map((s, i) => ({
    key: s.id || String(i),
    url: link(locale, s.url),
    picture: (
      <picture>
        {asMedia(s.mobileImage)?.url && <source media="(max-width: 767px)" srcSet={asMedia(s.mobileImage)!.url!} />}
        <Img media={s.image} sizes="100vw" size="large" priority={i === 0} alt={s.alt ?? 'Sochiu Studio'} className="sc-hero__img" />
      </picture>
    ),
  }))
  const library = (home.libraryCategories || []).filter((c): c is PostCategory => typeof c === 'object')

  return (
    <>
      <HeroSlider slides={slides} />

      <ProductTabs title={home.productsTitle} tabs={tabs} t={t} />

      {home.catalogueImage && (
        <section className="sc-catalogue">
          <div className="sc-catalogue__media">
            <Img media={home.catalogueImage} sizes="(max-width: 767px) 100vw, 67vw" size="large" />
          </div>
          <div className="sc-catalogue__body">
            {home.catalogueEyebrow && <p className="sc-catalogue__eyebrow">{home.catalogueEyebrow}</p>}
            {home.catalogueTitle && <h2 className="sc-catalogue__title">{home.catalogueTitle}</h2>}
            {home.catalogueButtonLabel && (
              <Link href={link(locale, home.catalogueButtonUrl) || href(locale, 'collections')} className="sc-btn sc-btn--dark">
                {home.catalogueButtonLabel}
              </Link>
            )}
          </div>
        </section>
      )}

      {library.length > 0 && (
        <section className="sc-library">
          {home.libraryTitle && <h2 className="sc-section-title">{home.libraryTitle}</h2>}
          <div className="sc-library__grid">
            {library.map((c) => (
              <Link key={c.id} href={postCategoryHref(locale, c.slug || '')} className="sc-library__tile">
                <div className="sc-library__media">
                  <Img media={c.image} sizes="(max-width: 767px) 80vw, 33vw" alt={c.title} />
                </div>
                <span className="sc-library__label">{c.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {home.fabricImage && (
        <section className="sc-fabric-cta">
          <Img media={home.fabricImage} sizes="100vw" size="large" className="sc-fabric-cta__bg" alt="" />
          <div className="sc-fabric-cta__body">
            {home.fabricTitle && <h2>{home.fabricTitle}</h2>}
            {home.fabricText && <p>{home.fabricText}</p>}
            {home.fabricButtonLabel && (
              <Link href={link(locale, home.fabricButtonUrl) || href(locale, 'fabrics')} className="sc-btn sc-btn--light">
                {home.fabricButtonLabel}
              </Link>
            )}
          </div>
        </section>
      )}

      {reviews.docs.length > 0 && (
        <section className="sc-inspiration">
          <div className="sc-inspiration__head">
            {home.inspirationTitle && <h2 className="sc-section-title">{home.inspirationTitle}</h2>}
            {home.inspirationText && <p>{home.inspirationText}</p>}
            {home.inspirationButtonLabel && (
              <Link href={link(locale, home.inspirationButtonUrl) || href(locale, 'inspiration')} className="sc-btn sc-btn--dark">
                {home.inspirationButtonLabel}
              </Link>
            )}
          </div>
          <Carousel className="sc-carousel--inspiration" labels={t.carousel}>
            {reviews.docs.map((r) => {
              const product = typeof r.product === 'object' ? r.product : null
              return (
                <Link key={r.id} href={href(locale, 'inspiration')} className="sc-carousel__slide sc-review-card">
                  <div className="sc-review-card__media">
                    <Img media={r.images?.[0]} sizes="(max-width: 767px) 75vw, 25vw" alt={r.title} />
                  </div>
                  <h3>{product?.title || r.productName || r.title.split(' - ')[0]}</h3>
                  <p>{r.customerName || t.inspiration.customer}</p>
                </Link>
              )
            })}
          </Carousel>
        </section>
      )}
    </>
  )
}
