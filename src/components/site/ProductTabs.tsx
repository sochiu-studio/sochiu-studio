'use client'

import { type ReactNode, useState } from 'react'

import type { Dict } from '@/i18n/dict'

import { Carousel } from './Carousel'

type Tab = { id: string | number; label: string; cards: ReactNode[] }

/** "SOFA · BÀN TRÀ · BÀN ĂN …" over a row of product cards, one row per category. */
export function ProductTabs({ title, tabs, t }: { title?: string | null; tabs: Tab[]; t: Dict }) {
  const [active, setActive] = useState(tabs[0]?.id)
  if (!tabs.length) return null
  return (
    <section className="sc-products">
      {title && <h2 className="sc-visually-hidden">{title}</h2>}
      <div className="sc-tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={tab.id === active}
            className={`sc-tabs__tab${tab.id === active ? ' is-active' : ''}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={tab.id !== active}>
          <Carousel className="sc-carousel--cards" labels={t.carousel}>
            {tab.cards.map((card, i) => (
              <div className="sc-carousel__slide" key={i}>
                {card}
              </div>
            ))}
          </Carousel>
        </div>
      ))}
    </section>
  )
}
