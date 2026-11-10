import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import { SetAlternate } from '@/components/site/Alternate'
import { Img } from '@/components/site/Img'
import { PageBody } from '@/components/site/PageBody'
import { RichText } from '@/components/site/RichText'
import { type Locale, locales, postHref, withLocale } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { asMedia } from '@/lib/media'
import { getClient } from '@/lib/payload'

export const revalidate = 300

type Params = Promise<{ locale: Locale; slug: string }>
const other = (l: Locale): Locale => (l === 'vi' ? 'en' : 'vi')

/** A blog post (the old site kept them at the root, /<slug>/), else a content page. */
const resolve = cache(async (locale: Locale, raw: string) => {
  const slug = decodeURIComponent(raw)
  const payload = await getClient()
  const post = (await payload.find({ collection: 'posts', locale, where: { slug: { equals: slug } }, limit: 1, depth: 2 })).docs[0]
  if (post) {
    const alt = await payload.findByID({ collection: 'posts', id: post.id, locale: other(locale), depth: 0, select: { slug: true } })
    return { kind: 'post' as const, doc: post, altSlug: alt.slug }
  }
  const page = (await payload.find({ collection: 'pages', locale, where: { slug: { equals: slug } }, limit: 1, depth: 2 })).docs[0]
  if (page) {
    const alt = await payload.findByID({ collection: 'pages', id: page.id, locale: other(locale), depth: 0, select: { slug: true } })
    return { kind: 'page' as const, doc: page, altSlug: alt.slug }
  }
  return null
})

export async function generateStaticParams() {
  const payload = await getClient()
  const out: { locale: Locale; slug: string }[] = []
  for (const locale of locales) {
    const [posts, pages] = await Promise.all([
      payload.find({ collection: 'posts', locale, limit: 1000, depth: 0, select: { slug: true } }),
      payload.find({ collection: 'pages', locale, limit: 200, depth: 0, select: { slug: true } }),
    ])
    for (const d of [...posts.docs, ...pages.docs]) if (d.slug) out.push({ locale, slug: d.slug })
  }
  return out
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params
  const r = await resolve(locale, slug)
  if (!r) return {}
  const d = r.doc
  const image = asMedia(d.meta?.image) ?? (r.kind === 'post' ? asMedia(r.doc.cover) : asMedia(r.doc.hero))
  const desc = d.meta?.description || (r.kind === 'post' ? r.doc.excerpt : undefined) || undefined
  return {
    title: d.meta?.title || d.title,
    description: desc,
    alternates: {
      canonical: withLocale(locale, `/${d.slug}`),
      languages: r.altSlug ? { [locale]: withLocale(locale, `/${d.slug}`), [other(locale)]: withLocale(other(locale), `/${r.altSlug}`) } : undefined,
    },
    openGraph: image?.url ? { images: [{ url: image.sizes?.large?.url || image.url }], type: r.kind === 'post' ? 'article' : 'website' } : undefined,
  }
}

export default async function SlugPage({ params }: { params: Params }) {
  const { locale, slug } = await params
  const t = dict(locale)
  const r = await resolve(locale, slug)
  if (!r) notFound()
  const alternate = r.altSlug ? <SetAlternate href={withLocale(other(locale), `/${r.altSlug}`)} /> : null

  if (r.kind === 'page')
    return (
      <>
        {alternate}
        <PageBody page={r.doc} locale={locale} />
      </>
    )

  const post = r.doc
  const payload = await getClient()
  const { docs: more } = await payload.find({
    collection: 'posts',
    locale,
    where: { id: { not_equals: post.id } },
    sort: '-publishedAt',
    limit: 3,
    depth: 1,
  })
  const date = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null
  return (
    <article>
      {alternate}
      <div className="sc-article">
        <h1 className="sc-article__title">{post.title}</h1>
        {date && (
          <p className="sc-article__meta">
            {t.blog.by} / {date}
          </p>
        )}
        <RichText data={post.content} />
      </div>
      {more.length > 0 && (
        <section className="sc-related">
          <h2>{t.blog.more}</h2>
          <div className="sc-blog__grid sc-blog__grid--flush">
            {more.map((p) => (
              <Link key={p.id} href={postHref(locale, p.slug || '')} className="sc-post-card">
                <div className="sc-post-card__media">
                  <Img media={p.cover} sizes="(max-width: 767px) 100vw, 33vw" alt={p.title} />
                </div>
                <h2>{p.title}</h2>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
