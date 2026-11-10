'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { Dict } from '@/i18n/dict'
import type { Pic as PicData } from '@/lib/media'

import { ChevronLeft, ChevronRight, CloseIcon, SearchIcon } from './Icons'
import { Pic } from './Pic'

export type FabricItem = {
  id: number
  name: string
  code?: string | null
  line: string
  leather: boolean
  intro?: string | null
  suitableFor?: string | null
  specs?: string | null
  thumb: PicData | null
  large: PicData | null
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

/** Every fabric and leather: Da / Vải, a search by code or colour, a filter by line, and a
 *  window with the material's story and numbers (arrows walk through the visible list). */
export function FabricLibrary({ items, t }: { items: FabricItem[]; t: Dict }) {
  const [group, setGroup] = useState<'all' | 'leather' | 'fabric'>('all')
  const [query, setQuery] = useState('')
  const [line, setLine] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [open, setOpen] = useState<number | null>(null)

  const lines = useMemo(() => [...new Set(items.map((i) => i.line).filter(Boolean))], [items])
  const visible = useMemo(() => {
    const q = fold(query.trim())
    return items.filter(
      (i) =>
        (group === 'all' || (group === 'leather') === i.leather) &&
        (!line || i.line === line) &&
        (!q || fold(`${i.name} ${i.code ?? ''}`).includes(q)),
    )
  }, [items, group, line, query])

  return (
    <div className="sc-fabrics">
      <div className="sc-fabrics__groups">
        {(['all', 'leather', 'fabric'] as const).map((g) => (
          <button key={g} className={group === g ? 'is-active' : undefined} onClick={() => setGroup(g)} aria-pressed={group === g}>
            {g === 'all' ? t.fabrics.all : g === 'leather' ? t.fabrics.leather : t.fabrics.fabric}
          </button>
        ))}
      </div>
      <div className="sc-fabrics__bar">
        <label className="sc-fabrics__search">
          <SearchIcon width={16} height={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.fabrics.search} aria-label={t.fabrics.search} />
        </label>
        <div className={`sc-shopbar__menu${filterOpen ? ' is-open' : ''}`}>
          <button onClick={() => setFilterOpen((o) => !o)} aria-expanded={filterOpen}>
            {t.fabrics.filter}
            <span aria-hidden>{filterOpen ? '−' : '+'}</span>
          </button>
          {filterOpen && (
            <ul>
              {[null, ...lines].map((l) => (
                <li key={l ?? 'all'}>
                  <button
                    className={line === l ? 'is-active' : undefined}
                    onClick={() => {
                      setLine(l)
                      setFilterOpen(false)
                    }}
                  >
                    {l ?? t.fabrics.allLines}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {visible.length ? (
        <div className="sc-fabrics__grid">
          {visible.map((f, i) => (
            <button key={f.id} className="sc-fabric" onClick={() => setOpen(i)}>
              <span className="sc-fabric__thumb">
                <Pic pic={f.thumb} sizes="200px" />
                <span className="sc-fabric__plus" aria-hidden>
                  +
                </span>
              </span>
              <span className="sc-fabric__info">
                <span className="sc-fabric__line">{f.line}</span>
                <span className="sc-fabric__name">{f.name}</span>
                {f.code && <span className="sc-fabric__code">{f.code}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="sc-shop__empty">{t.fabrics.empty}</p>
      )}

      {open !== null && visible[open] && (
        <FabricWindow
          item={visible[open]}
          t={t}
          onClose={() => setOpen(null)}
          onPrev={open > 0 ? () => setOpen(open - 1) : undefined}
          onNext={open < visible.length - 1 ? () => setOpen(open + 1) : undefined}
        />
      )}
    </div>
  )
}

function FabricWindow({ item, t, onClose, onPrev, onNext }: { item: FabricItem; t: Dict; onClose: () => void; onPrev?: () => void; onNext?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev?.()
      if (e.key === 'ArrowRight') onNext?.()
    }
    window.addEventListener('keydown', keys)
    return () => window.removeEventListener('keydown', keys)
  }, [onPrev, onNext])
  const paragraphs = (s?: string | null) => (s || '').split(/\n{2,}/).filter(Boolean)
  return (
    <dialog ref={dialog} className="sc-modal sc-modal--fabric" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
      <div className="sc-modal__panel">
        <button className="sc-modal__close" onClick={onClose} aria-label={t.inquiry.close}>
          <CloseIcon />
        </button>
        <div className="sc-fabric-window">
          <Pic key={item.id} pic={item.large} sizes="(max-width: 767px) 90vw, 400px" className="sc-fabric-window__img" />
          <div className="sc-fabric-window__body">
            <h2>
              {item.name} {item.code && <small>[{item.code}]</small>}
            </h2>
            {paragraphs(item.intro).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {item.suitableFor && (
              <>
                <hr />
                <h3>{t.fabrics.suitable}</h3>
                <p>{item.suitableFor}</p>
              </>
            )}
            {item.specs && (
              <>
                <h3>{t.fabrics.specs}</h3>
                <p className="sc-fabric-window__specs">{item.specs}</p>
              </>
            )}
          </div>
        </div>
      </div>
      {onPrev && (
        <button className="sc-modal__nav sc-modal__nav--prev" onClick={onPrev} aria-label={t.carousel.prev}>
          <ChevronLeft width={28} height={28} />
        </button>
      )}
      {onNext && (
        <button className="sc-modal__nav sc-modal__nav--next" onClick={onNext} aria-label={t.carousel.next}>
          <ChevronRight width={28} height={28} />
        </button>
      )}
    </dialog>
  )
}
