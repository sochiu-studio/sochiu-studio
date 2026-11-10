import Link from 'next/link'

import { type Locale, withLocale } from '@/i18n/config'
import { asMedia } from '@/lib/media'
import type { Page } from '@/payload-types'

import { FaqTabs } from './FaqTabs'
import { Img } from './Img'
import { RichText } from './RichText'

const link = (locale: Locale, url?: string | null) => (url ? (/^(https?:|tel:|mailto:|#)/.test(url) ? url : withLocale(locale, url)) : null)

/** A content page: hero, text, image & text sections, FAQ, PDF - whichever it has. */
export function PageBody({ page, locale, showTitle = true }: { page: Page; locale: Locale; showTitle?: boolean }) {
  const groups = new Map<string, { id: string; question: string; answer: React.ReactNode }[]>()
  for (const f of page.faqs || []) {
    const key = f.group || ''
    groups.set(key, [...(groups.get(key) || []), { id: f.id || f.question, question: f.question, answer: <RichText data={f.answer} /> }])
  }
  const pdf = asMedia(page.pdf)
  const hasText = Boolean(page.content || groups.size || pdf)

  return (
    <article className="sc-page">
      {page.hero && <Img media={page.hero} sizes="100vw" size="large" className="sc-page__hero" priority />}

      {(page.sections || []).map((s, i) => (
        <section key={s.id || i} className={`sc-split sc-split--${s.imageSide || 'left'} sc-split--${s.background || 'white'}`}>
          <div className="sc-split__media">
            <Img media={s.image} sizes="(max-width: 767px) 100vw, 45vw" size="large" priority={i === 0} />
          </div>
          <div className="sc-split__body">
            {s.heading && (i === 0 && showTitle ? <h1>{s.heading}</h1> : <h2>{s.heading}</h2>)}
            {s.body?.split(/\n{2,}/).map((p, j) => <p key={j}>{p}</p>)}
            {s.buttonLabel && link(locale, s.buttonUrl) && (
              <Link href={link(locale, s.buttonUrl)!} className="sc-btn sc-btn--dark">
                {s.buttonLabel}
              </Link>
            )}
          </div>
        </section>
      ))}

      {hasText && (
        <div className={`sc-article${pdf ? ' sc-article--wide' : ''}`}>
          {showTitle && !page.sections?.length && <h1 className="sc-article__title">{page.title}</h1>}
          <RichText data={page.content} />
          {groups.size > 0 && <FaqTabs groups={[...groups].map(([name, items]) => ({ name, items }))} />}
          {pdf?.url && <iframe src={pdf.url} title={page.title} className="sc-pdf" />}
        </div>
      )}
    </article>
  )
}
