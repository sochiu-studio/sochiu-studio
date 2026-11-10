'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

/** Shows `step` items, then the next ones when the end comes into view (or the button is
 *  pressed) - the old shop's infinite scroll, without another request. */
export function LoadMore({ items, step = 12, className, label }: { items: ReactNode[]; step?: number; className?: string; label: string }) {
  const [count, setCount] = useState(step)
  const sentinel = useRef<HTMLDivElement>(null)
  const more = count < items.length

  useEffect(() => {
    const el = sentinel.current
    if (!el || !more) return
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && setCount((c) => c + step), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [more, step])

  return (
    <>
      <div className={className}>{items.slice(0, count)}</div>
      {more && (
        <div ref={sentinel} className="sc-loadmore">
          <button className="sc-btn sc-btn--dark" onClick={() => setCount((c) => c + step)}>
            {label}
          </button>
        </div>
      )}
    </>
  )
}
