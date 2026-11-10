import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { InfoTabs } from '@/components/site/InfoTabs'
import { ProductCard } from '@/components/site/ProductCard'
import { type Option, ProductView, type Variant } from '@/components/site/ProductView'
import { RichText } from '@/components/site/RichText'
import { categoryHref, href, type Locale, locales, productHref } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { asMedia, toPic } from '@/lib/media'
import { getClient } from '@/lib/payload'
import type { Fabric, Product, ProductCategory } from '@/payload-types'

export const revalidate = 300

type Params = Promise<{ locale: Locale; slug: string }>

const getProduct = cache(async (locale: Locale, slug: string) => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'products',
    locale,
    where: { slug: { equals: decodeURIComponent(slug) } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
})

export async function generateStaticParams() {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'products', limit: 1000, depth: 0, select: { slug: true } })
  return locales.flatMap((locale) => docs.map((d) => ({ locale, slug: d.slug || '' })))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getProduct(locale, slug)
  if (!p) return {}
  const image = asMedia(p.meta?.image) ?? asMedia(p.images?.[0])
  return {
    title: p.meta?.title || p.title,
    description: p.meta?.description || p.shortDescription || undefined,
    alternates: {
      canonical: productHref(locale, p.slug || ''),
      languages: { vi: productHref('vi', p.slug || ''), en: productHref('en', p.slug || '') },
    },
    openGraph: image?.url ? { images: [{ url: image.sizes?.large?.url || image.url }] } : undefined,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  const t = dict(locale)
  const product = await getProduct(locale, slug)
  if (!product) notFound()

  const payload = await getClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', locale, depth: 1 })
  const category = (product.category || []).find((c): c is ProductCategory => typeof c === 'object')

  // picked by hand, else others from the same category
  let related = (product.related || []).filter((r): r is Product => typeof r === 'object')
  if (!related.length && category) {
    const { docs } = await payload.find({
      collection: 'products',
      locale,
      where: { and: [{ category: { in: [category.id] } }, { id: { not_equals: product.id } }] },
      sort: '-wpId',
      limit: 6,
      depth: 1,
      select: { title: true, slug: true, images: true, priceFrom: true },
    })
    related = docs as Product[]
  }

  const options: Option[] = (product.options || []).map((o) => ({
    name: o.name,
    values: (o.values || []).map((v) => {
      const fabric = typeof v.fabric === 'object' ? (v.fabric as Fabric) : null
      // the fabric library's swatch, else the value's own picture, else the first variant wearing it
      const variantImage = (product.variants || []).find((x) => x.optionValues.split('|').includes(v.value))?.image
      const source = fabric?.swatch ?? v.image ?? (hasSingleOption(product) ? variantImage : null)
      const chip = fabric?.thumbnail ?? source
      return {
        label: v.label,
        value: v.value,
        color: v.color,
        swatch: toPic(chip, v.label, 'thumb'),
        zoom: toPic(source, v.label, 'card'),
        fabric: fabric ? { name: fabric.name, code: fabric.code, line: fabric.line } : null,
      }
    }),
  }))
  const variants: Variant[] = (product.variants || []).map((v) => ({
    optionValues: v.optionValues,
    price: v.price ?? null,
    salePrice: v.salePrice ?? null,
    image: toPic(v.image, product.title),
  }))

  const description = (
    <>
      <RichText data={product.description} />
      {product.specs && product.specs.length > 0 && (
        <dl className="sc-specs">
          {product.specs.map((s) => (
            <div key={s.id}>
              <dt>{s.label}:</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )
  const tabs = [
    { id: 'description', label: t.product.description, content: description },
    ...(settings.productInfoTabs || []).map((tab) => ({ id: tab.id || tab.title, label: tab.title, content: <RichText data={tab.content} /> })),
  ]

  return (
    <>
      <ProductView
        t={t}
        id={product.id}
        title={product.title}
        crumbs={[
          { label: t.product.home, href: href(locale, 'home') },
          ...(category ? [{ label: category.title, href: categoryHref(locale, category.slug || '') }] : []),
          { label: product.title },
        ]}
        images={(product.images || []).map((m) => toPic(m, product.title)).filter((x) => x !== null)}
        detailImages={(product.detailImages || []).map((m) => toPic(m, product.title)).filter((x) => x !== null)}
        priceFrom={product.priceFrom ?? null}
        priceTo={product.priceTo ?? null}
        options={options}
        variants={variants}
        info={<InfoTabs tabs={tabs} />}
      />
      {related.length > 0 && (
        <section className="sc-related">
          <h2>{t.product.related}</h2>
          <div className="sc-related__grid">
            {related.slice(0, 6).map((r) => (
              <ProductCard key={r.id} product={r} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/** With one attribute, a value's variant picture is a fair swatch; with two it's ambiguous. */
const hasSingleOption = (p: Product) => (p.options || []).length === 1
