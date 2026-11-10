'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Dict } from '@/i18n/dict'
import type { Pic as PicData } from '@/lib/media'

import { ChevronRight, CloseIcon, SearchIcon } from './Icons'
import { Pic } from './Pic'

export type ReviewItem = {
  id: number
  title: string
  customer: string
  location?: string | null
  date?: string | null
  content?: string | null
  images: PicData[]
  product?: { title: string; href: string | null; thumb: PicData | null } | null
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()
const STEP = 12

/** Customers' photos: search, 12 at a time, and a window per review. */
export function InspirationGallery({ items, t }: { items: ReviewItem[]; t: Dict }) {
  const [query, setQuery] = useState('')
  const [count, setCount] = useState(STEP)
  const [open, setOpen] = useState<ReviewItem | null>(null)
  const visible = useMemo(() => {
    const q = fold(query.trim())
    return q ? items.filter((r) => fold(`${r.title} ${r.customer} ${r.product?.title ?? ''}`).includes(q)) : items
  }, [items, query])

  return (
    <div className="sc-insp">
      <div className="sc-insp__head">
        <h1>{t.inspiration.title}</h1>
      </div>
      <label className="sc-fabrics__search sc-insp__search">
        <SearchIcon width={16} height={16} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCount(STEP)
          }}
          placeholder={t.inspiration.search}
          aria-label={t.inspiration.search}
        />
      </label>
      {visible.length ? (
        <div className="sc-insp__grid">
          {visible.slice(0, count).map((r) => (
            <button key={r.id} className="sc-insp__card" onClick={() => setOpen(r)} aria-label={r.title}>
              <Pic pic={r.images[0] ?? null} sizes="(max-width: 767px) 50vw, 33vw" />
              <span className="sc-fabric__plus" aria-hidden>
                +
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="sc-shop__empty">{t.inspiration.empty}</p>
      )}
      {count < visible.length && (
        <div className="sc-loadmore">
          <button className="sc-btn sc-btn--dark" onClick={() => setCount((c) => c + STEP)}>
            {t.shop.more}
          </button>
        </div>
      )}
      {open && <ReviewWindow item={open} t={t} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ReviewWindow({ item, t, onClose }: { item: ReviewItem; t: Dict; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])
  const date = item.date ? new Date(item.date).toLocaleDateString('vi-VN') : null
  return (
    <dialog ref={dialog} className="sc-modal sc-modal--review" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
      <div className="sc-modal__panel">
        <h2 className="sc-review__title">{t.inspiration.detail}</h2>
        <button className="sc-modal__close" onClick={onClose} aria-label={t.inquiry.close}>
          <CloseIcon />
        </button>
        {item.product?.href ? (
          <Link href={item.product.href} className="sc-review__product">
            <span className="sc-review__product-thumb">
              <Pic pic={item.product.thumb} sizes="48px" />
            </span>
            <span>{item.product.title}</span>
            <ChevronRight width={16} height={16} />
          </Link>
        ) : (
          item.product && (
            <p className="sc-review__product">
              <span className="sc-review__product-thumb">
                <Pic pic={item.product.thumb} sizes="48px" />
              </span>
              <span>{item.product.title}</span>
            </p>
          )
        )}
        <Pic pic={item.images[index] ?? null} sizes="(max-width: 767px) 90vw, 460px" className="sc-review__main" />
        {item.images.length > 1 && (
          <div className="sc-review__thumbs">
            {item.images.map((p, i) => (
              <button key={p.src} className={i === index ? 'is-active' : undefined} onClick={() => setIndex(i)} aria-label={`${i + 1}`}>
                <Pic pic={p} sizes="90px" />
              </button>
            ))}
          </div>
        )}
        <div className="sc-review__box">
          <p className="sc-review__customer">{item.customer}</p>
          <p className="sc-review__meta">{[item.location, date].filter(Boolean).join(' · ')}</p>
          {item.content && <p className="sc-review__content">{item.content}</p>}
        </div>
      </div>
    </dialog>
  )
}
