'use client'

import { useState } from 'react'

import type { Dict } from '@/i18n/dict'

import { CloseIcon, MessengerIcon, PhoneIcon, ZaloIcon } from './Icons'

type Props = { t: Dict; hotline?: string | null; zalo?: string | null; messenger?: string | null }

/** The round button in the corner: hotline, Zalo and Messenger. */
export function FloatingContact({ t, hotline, zalo, messenger }: Props) {
  const [open, setOpen] = useState(false)
  const links = [
    hotline && { label: t.contact.hotline, href: `tel:${hotline.replace(/\D/g, '')}`, icon: <PhoneIcon width={18} height={18} /> },
    zalo && { label: t.contact.zalo, href: zalo, icon: <ZaloIcon width={18} height={18} /> },
    messenger && { label: t.contact.messenger, href: messenger, icon: <MessengerIcon width={18} height={18} /> },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode }[]
  if (!links.length) return null
  return (
    <div className={`sc-contact${open ? ' is-open' : ''}`}>
      {open && (
        <ul className="sc-contact__list">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                {l.icon}
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <button className="sc-contact__btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t.contact.open}>
        {open ? <CloseIcon width={22} height={22} /> : <PhoneIcon width={24} height={24} />}
      </button>
    </div>
  )
}
