'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import type { Dict } from '@/i18n/dict'
import { formatPrice } from '@/lib/format'
import type { Pic as PicData } from '@/lib/media'

import { ChevronLeft, ChevronRight, CloseIcon, SearchIcon } from './Icons'
import { InquiryModal } from './InquiryModal'
import { Pic } from './Pic'

export type OptionValue = {
  label: string
  value: string
  swatch: PicData | null
  zoom: PicData | null
  color?: string | null
  fabric?: { name: string; code?: string | null; line?: string | null } | null
}
export type Option = { name: string; values: OptionValue[] }
export type Variant = { optionValues: string; price: number | null; salePrice: number | null; image: PicData | null }

type Props = {
  t: Dict
  id: number
  title: string
  crumbs: { label: string; href?: string }[]
  images: PicData[]
  detailImages: PicData[]
  priceFrom: number | null
  priceTo: number | null
  options: Option[]
  variants: Variant[]
  info: ReactNode
}

const matches = (variant: Variant, chosen: (string | null)[]) => {
  const keys = variant.optionValues.split('|')
  return chosen.every((c, i) => c === null || keys[i] === '*' || keys[i] === c)
}

export function ProductView(p: Props) {
  const { t } = p
  const [chosen, setChosen] = useState<(string | null)[]>(() => p.options.map(() => null))
  const [consultOpen, setConsultOpen] = useState(false)
  const [zoom, setZoom] = useState<OptionValue | null>(null)

  const complete = chosen.every((c) => c !== null)
  const variant = useMemo(() => (complete ? (p.variants.find((v) => matches(v, chosen)) ?? null) : null), [complete, chosen, p.variants])

  // the chosen variant's picture leads the gallery
  const slides = useMemo(() => {
    const own = variant?.image
    if (!own) return p.images
    return [own, ...p.images.filter((i) => i.src !== own.src)]
  }, [variant, p.images])

  const price = (() => {
    if (variant?.price) {
      const sale = variant.salePrice && variant.salePrice < variant.price ? variant.salePrice : null
      return (
        <p className="sc-pdp__price">
          {sale ? (
            <>
              <del>{formatPrice(variant.price)}</del> <ins>{formatPrice(sale)}</ins>
            </>
          ) : (
            formatPrice(variant.price)
          )}
        </p>
      )
    }
    if (p.priceFrom && p.priceTo && p.priceTo !== p.priceFrom)
      return (
        <p className="sc-pdp__price">
          {formatPrice(p.priceFrom)} - {formatPrice(p.priceTo)}
        </p>
      )
    return <p className="sc-pdp__price">{p.priceFrom ? formatPrice(p.priceFrom) : t.product.contact}</p>
  })()

  return (
    <div className="sc-pdp">
      <div className="sc-pdp__media">
        <Gallery slides={slides} t={t} />
        {p.detailImages.map((pic, i) => (
          <Pic key={`${pic.src}-${i}`} pic={pic} sizes="(max-width: 1024px) 100vw, 65vw" className="sc-pdp__detail" />
        ))}
      </div>

      <aside className="sc-pdp__panel">
        <div className="sc-pdp__sticky">
          <nav className="sc-crumbs" aria-label="Breadcrumb">
            {p.crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && ' / '}
                {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
              </span>
            ))}
          </nav>
          <h1 className="sc-pdp__title">{p.title}</h1>

          <div className="sc-pdp__block">
            <p className="sc-pdp__label">{variant ? t.product.price : t.product.priceRange}</p>
            {price}
          </div>

          {p.options.map((o, oi) => (
            <div key={o.name} className="sc-pdp__block">
              <p className="sc-pdp__label">{o.name}</p>
              <ul className="sc-swatches">
                {o.values.map((v) => {
                  const on = chosen[oi] === v.value
                  return (
                    <li key={v.value} className={on ? 'is-active' : undefined}>
                      <button
                        className="sc-swatches__pick"
                        aria-pressed={on}
                        onClick={() => setChosen((c) => c.map((x, i) => (i === oi ? (on ? null : v.value) : x)))}
                      >
                        <span className="sc-swatches__chip" style={v.color && !v.swatch ? { background: v.color } : undefined}>
                          <Pic pic={v.swatch} sizes="44px" />
                        </span>
                        <span>{v.label}</span>
                      </button>
                      {v.zoom && (
                        <button className="sc-swatches__zoom" onClick={() => setZoom(v)} aria-label={`${t.product.zoom}: ${v.label}`}>
                          <SearchIcon width={14} height={14} />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}

          <button className="sc-btn sc-btn--dark sc-pdp__cta" onClick={() => setConsultOpen(true)}>
            {t.product.consult}
          </button>

          {p.info}
        </div>
      </aside>

      <InquiryModal
        t={t}
        open={consultOpen}
        onClose={() => setConsultOpen(false)}
        productId={p.id}
        productTitle={[p.title, ...chosen.map((c, i) => p.options[i]?.values.find((v) => v.value === c)?.label)].filter(Boolean).join(' - ')}
      />
      {zoom && <SwatchZoom value={zoom} onClose={() => setZoom(null)} t={t} />}
    </div>
  )
}

/** The main pictures: one at a time, arrows, a line per picture underneath. */
function Gallery({ slides, t }: { slides: PicData[]; t: Dict }) {
  const track = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  // a new set (another colour chosen) starts from its first picture
  useEffect(() => {
    track.current?.scrollTo({ left: 0 })
  }, [slides])

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const next = Math.max(0, Math.min(slides.length - 1, i))
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
  }
  if (!slides.length) return null
  return (
    <div className="sc-gallery">
      <div
        className="sc-gallery__track"
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
      >
        {slides.map((pic, i) => (
          <div key={`${pic.src}-${i}`} className="sc-gallery__slide">
            <Pic pic={pic} sizes="(max-width: 1024px) 100vw, 40vw" priority={i === 0} />
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <button className="sc-gallery__arrow sc-gallery__arrow--prev" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t.carousel.prev}>
            <ChevronLeft />
          </button>
          <button
            className="sc-gallery__arrow sc-gallery__arrow--next"
            onClick={() => go(index + 1)}
            disabled={index >= slides.length - 1}
            aria-label={t.carousel.next}
          >
            <ChevronRight />
          </button>
          <div className="sc-gallery__bar">
            <span style={{ width: `${100 / slides.length}%`, transform: `translateX(${index * 100}%)` }} />
          </div>
        </>
      )}
    </div>
  )
}

function SwatchZoom({ value, onClose, t }: { value: OptionValue; onClose: () => void; t: Dict }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialog.current?.showModal()
  }, [])
  return (
    <dialog ref={dialog} className="sc-modal sc-modal--swatch" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
      <div className="sc-modal__panel">
        <button className="sc-modal__close" onClick={onClose} aria-label={t.inquiry.close}>
          <CloseIcon />
        </button>
        <Pic pic={value.zoom} sizes="(max-width: 767px) 90vw, 480px" className="sc-swatch-zoom__img" />
        <div className="sc-swatch-zoom__info">
          {value.fabric?.line && <p className="sc-swatch-zoom__line">{value.fabric.line}</p>}
          <p className="sc-swatch-zoom__name">{value.fabric?.name || value.label}</p>
          {value.fabric?.code && <p className="sc-swatch-zoom__code">{value.fabric.code}</p>}
        </div>
      </div>
    </dialog>
  )
}
