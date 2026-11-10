'use client'

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight } from './Icons'

type Props = { children: ReactNode; className?: string; labels: { prev: string; next: string } }

/** A row that scrolls sideways (touch, trackpad) with arrows; each child is one slide. */
export function Carousel({ children, className, labels }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])
  useEffect(() => {
    update()
    const el = track.current
    el?.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update, children])

  const go = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const slide = el.firstElementChild as HTMLElement | null
    el.scrollBy({ left: dir * (slide?.offsetWidth || el.clientWidth), behavior: 'smooth' })
  }

  return (
    <div className={`sc-carousel ${className ?? ''}`}>
      <div className="sc-carousel__track" ref={track}>
        {children}
      </div>
      <button className="sc-carousel__arrow sc-carousel__arrow--prev" onClick={() => go(-1)} disabled={edges.start} aria-label={labels.prev}>
        <ChevronLeft />
      </button>
      <button className="sc-carousel__arrow sc-carousel__arrow--next" onClick={() => go(1)} disabled={edges.end} aria-label={labels.next}>
        <ChevronRight />
      </button>
    </div>
  )
}
