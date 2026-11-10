'use client'

import { type ReactNode, useState } from 'react'

/** FAQ: a tab per group ("Giao hàng", "Bảo hành"…), questions that open in place. */
export function FaqTabs({ groups }: { groups: { name: string; items: { id: string; question: string; answer: ReactNode }[] }[] }) {
  const [active, setActive] = useState(0)
  if (!groups.length) return null
  return (
    <div className="sc-faq">
      {groups.length > 1 && (
        <div className="sc-blog__tabs" role="tablist">
          {groups.map((g, i) => (
            <button key={g.name} role="tab" aria-selected={i === active} className={i === active ? 'is-active' : undefined} onClick={() => setActive(i)}>
              {g.name}
            </button>
          ))}
        </div>
      )}
      {groups.map((g, i) => (
        <div key={g.name} role="tabpanel" hidden={i !== active} className="sc-faq__list">
          {g.items.map((f) => (
            <details key={f.id}>
              <summary>{f.question}</summary>
              <div className="sc-faq__answer">{f.answer}</div>
            </details>
          ))}
        </div>
      ))}
    </div>
  )
}
