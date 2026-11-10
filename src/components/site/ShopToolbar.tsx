'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Item = { label: string; href: string; active?: boolean }
type Menu = { label: string; items: Item[]; clear: Item }

/** The row above the shop grid: categories on the left, "Bộ lọc" and "Thứ tự" on the right. */
export function ShopToolbar({ categories, menus }: { categories: Item[]; menus: Menu[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])
  return (
    <div className="sc-shopbar" ref={ref}>
      <nav className="sc-shopbar__cats" aria-label="Categories">
        {categories.map((c) => (
          <Link key={c.href} href={c.href} className={c.active ? 'is-active' : undefined} aria-current={c.active ? 'page' : undefined}>
            {c.label}
          </Link>
        ))}
      </nav>
      {menus.map((m, i) => (
        <div key={m.label} className={`sc-shopbar__menu${open === i ? ' is-open' : ''}`}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            {m.label}
            <span aria-hidden>{open === i ? '−' : '+'}</span>
          </button>
          {open === i && (
            <ul>
              {[...m.items, m.clear].map((it) => (
                <li key={it.label}>
                  <Link href={it.href} className={it.active ? 'is-active' : undefined} onClick={() => setOpen(null)}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
