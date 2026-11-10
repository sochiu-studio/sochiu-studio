'use client'

import Link from 'next/link'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

type Slide = { key: string; url?: string | null; picture: ReactNode }

const DELAY = 5000

/** Full-height banners that fade into one another, with a line per slide at the bottom. */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // only the slide on screen and the next one are in the page: five full-width pictures
  // decoding at once made the first seconds of scrolling stutter
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0, 1]))
  const count = slides.length
  const show = useCallback(
    (i: number) => {
      setIndex(i)
      setSeen((prev) => (prev.has(i) && prev.has((i + 1) % count) ? prev : new Set([...prev, i, (i + 1) % count])))
    },
    [count],
  )

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const id = window.setTimeout(() => show((index + 1) % slides.length), DELAY)
    return () => window.clearTimeout(id)
  }, [index, paused, slides.length, show])

  if (!slides.length) return null
  return (
    <section className="sc-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {slides.map((s, i) => {
        const body = <div className="sc-hero__picture">{seen.has(i) ? s.picture : null}</div>
        return (
          <div key={s.key} className={`sc-hero__slide${i === index ? ' is-active' : ''}`} aria-hidden={i !== index}>
            {s.url ? (
              <Link href={s.url} tabIndex={i === index ? 0 : -1}>
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        )
      })}
      {slides.length > 1 && (
        <div className="sc-hero__dots">
          {slides.map((s, i) => (
            <button key={s.key} className={i === index ? 'is-active' : undefined} onClick={() => show(i)} aria-label={`${i + 1} / ${slides.length}`}>
              <span style={i === index && !paused ? { animationDuration: `${DELAY}ms` } : undefined} />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
