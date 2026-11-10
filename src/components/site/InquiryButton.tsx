'use client'

import { useState } from 'react'

import type { Dict } from '@/i18n/dict'

import { InquiryModal } from './InquiryModal'

/** A button that opens the consultation / showroom-visit forms. */
export function InquiryButton({ t, label, className, tab }: { t: Dict; label: string; className?: string; tab?: 'consult' | 'visit' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className={className ?? 'sc-btn sc-btn--dark'} onClick={() => setOpen(true)}>
        {label}
      </button>
      <InquiryModal t={t} open={open} onClose={() => setOpen(false)} initialTab={tab} />
    </>
  )
}
