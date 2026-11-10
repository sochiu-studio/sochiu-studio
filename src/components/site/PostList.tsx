import Link from 'next/link'

import { href, type Locale, postCategoryHref, postHref } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getClient } from '@/lib/payload'
import type { PostCategory } from '@/payload-types'

import { Img } from './Img'

const ANNOUNCEMENTS = 'thong-bao'

/** /blogs/ (everything but announcements), /thong-bao/ and /category/<slug>/. */
export async function PostList({ locale, category, title }: { locale: Locale; category?: PostCategory; title: string }) {
  const t = dict(locale)
  const payload = await getClient()
  const { docs: categories } = await payload.find({ collection: 'post-categories', locale, limit: 50, depth: 0 })
  // announcements have their own page; the vi slug names them in both languages
  const { docs: viCats } = await payload.find({ collection: 'post-categories', locale: 'vi', limit: 50, depth: 0, select: { slug: true } })
  const announcementId = viCats.find((c) => c.slug === ANNOUNCEMENTS)?.id
  const tabs = categories.filter((c) => c.id !== announcementId)
  const isAnnouncements = category?.id === announcementId

  const { docs } = await payload.find({
    collection: 'posts',
    locale,
    sort: '-publishedAt',
    limit: 100,
    depth: 1,
    where: category
      ? { categories: { in: [category.id] } }
      : announcementId
        ? { categories: { not_in: [announcementId] } }
        : undefined,
  })

  return (
    <div className="sc-blog">
      <h1 className="sc-blog__title">{title}</h1>
      {!isAnnouncements && (
        <nav className="sc-blog__tabs" aria-label={t.blog.title}>
          <Link href={href(locale, 'blog')} className={!category ? 'is-active' : undefined}>
            {t.blog.all}
          </Link>
          {tabs.map((c) => (
            <Link key={c.id} href={postCategoryHref(locale, c.slug || '')} className={c.id === category?.id ? 'is-active' : undefined}>
              {c.title}
            </Link>
          ))}
        </nav>
      )}
      {docs.length ? (
        <div className="sc-blog__grid">
          {docs.map((p) => {
            const cat = (p.categories || []).find((c): c is PostCategory => typeof c === 'object')
            return (
              <Link key={p.id} href={postHref(locale, p.slug || '')} className="sc-post-card">
                <div className="sc-post-card__media">
                  <Img media={p.cover} sizes="(max-width: 767px) 100vw, 33vw" alt={p.title} />
                </div>
                <h2>{p.title}</h2>
                {cat && <p>{cat.title}</p>}
              </Link>
            )
          })}
        </div>
      ) : (
        <p className="sc-shop__empty">{t.blog.empty}</p>
      )}
    </div>
  )
}
