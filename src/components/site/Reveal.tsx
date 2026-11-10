'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// What rises into view as the page scrolls: cards, pictures, headings, blocks of text.
const TARGETS = [
  '.sc-carousel',
  '.sc-card',
  '.sc-post-card',
  '.sc-collection-card',
  '.sc-fabric',
  '.sc-insp__card',
  '.sc-review-card',
  '.sc-library__tile',
  '.sc-section-title',
  '.sc-catalogue__media',
  '.sc-catalogue__body',
  '.sc-fabric-cta__body',
  '.sc-inspiration__head',
  '.sc-split__media',
  '.sc-split__body',
  '.sc-related h2',
  '.sc-collection__story',
  '.sc-collection__image',
  '.sc-pdp__detail',
  '.sc-footer__grid > *',
  '.sc-support__cards section',
].join(',')

/**
 * Elements below the fold start a little lower and transparent and settle in when they enter
 * the viewport; ones already on screen are left alone (no flash on load). Siblings in a row are
 * staggered. Cards added later (the shop's "load more") are picked up too. Nothing happens for
 * people who ask their system for less motion.
 */
export function Reveal() {
  const pathname = usePathname()
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.getElementById('content')?.parentElement
    if (!root) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        }
      },
      // start just before it scrolls in, so it has settled by the time it is in full view
      { rootMargin: '0px 0px 12% 0px', threshold: 0 },
    )
    const prepare = (el: Element) => {
      // already waiting from an earlier run of this effect (React re-runs it in development,
      // the page may re-render): watch it again, or it would stay hidden
      if (el.classList.contains('sc-reveal')) {
        if (!el.classList.contains('is-in')) io.observe(el)
        return
      }
      // a sideways row rises as one: its cards would otherwise wait off to the right and fade in
      // only while being swiped, which reads as a stutter
      if (el.closest('.sc-carousel__track')) return
      const r = el.getBoundingClientRect()
      // on screen already, or off to the side (a row that scrolls sideways on phones): leave it
      if (r.top < window.innerHeight && r.bottom > 0) return
      if (r.left >= window.innerWidth || r.right <= 0) return
      el.classList.add('sc-reveal')
      // stagger the items of one row: the position among its siblings, three at a time
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0
      ;(el as HTMLElement).style.setProperty('--reveal-delay', `${(i % 3) * 60}ms`)
      io.observe(el)
    }
    const scan = (node: ParentNode) => node.querySelectorAll(TARGETS).forEach(prepare)
    scan(root)
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && (n.matches(TARGETS) ? prepare(n) : scan(n)))
    })
    mo.observe(root, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])
  return null
}
