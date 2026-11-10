'use client'

import { type ReactNode, useState } from 'react'

/** Mô tả · Lưu ý · Vận chuyển · Chính sách */
export function InfoTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  if (!tabs.length) return null
  return (
    <div className="sc-info">
      <div className="sc-info__tabs" role="tablist">
        {tabs.map((tab) => (
          <button key={tab.id} role="tab" aria-selected={tab.id === active} className={tab.id === active ? 'is-active' : undefined} onClick={() => setActive(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" hidden={tab.id !== active} className="sc-info__panel">
          {tab.content}
        </div>
      ))}
    </div>
  )
}
