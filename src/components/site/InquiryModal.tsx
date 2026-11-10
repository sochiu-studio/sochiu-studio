'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import { sendInquiry, type InquiryState } from '@/app/(frontend)/actions'
import type { Dict } from '@/i18n/dict'

import { CloseIcon } from './Icons'

type Props = { t: Dict; productId?: number; productTitle?: string; open: boolean; onClose: () => void; initialTab?: 'consult' | 'visit' }

/** The two forms behind "Nhận tư vấn chi tiết": advice, or a showroom visit. */
export function InquiryModal({ t, productId, productTitle, open, onClose, initialTab = 'consult' }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [tab, setTab] = useState<'consult' | 'visit'>(initialTab)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={dialog} className="sc-modal" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
      <div className="sc-modal__panel">
        <button className="sc-modal__close" onClick={onClose} aria-label={t.inquiry.close}>
          <CloseIcon />
        </button>
        <div className="sc-modal__tabs" role="tablist">
          {(['consult', 'visit'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'is-active' : undefined} onClick={() => setTab(k)}>
              {k === 'consult' ? t.inquiry.consultTab : t.inquiry.visitTab}
            </button>
          ))}
        </div>
        {/* a fresh form per tab and per opening: no stale "thank you" */}
        {open && <InquiryForm key={tab} type={tab} t={t} productId={productId} productTitle={productTitle} />}
      </div>
    </dialog>
  )
}

function InquiryForm({ type, t, productId, productTitle }: { type: 'consult' | 'visit'; t: Dict; productId?: number; productTitle?: string }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(sendInquiry, null)
  if (state?.ok) return <p className="sc-form__thanks">{t.inquiry.thanks}</p>
  const options = type === 'consult' ? t.inquiry.needOptions : t.inquiry.interestOptions
  return (
    <form action={action} className="sc-form">
      <h2>{type === 'consult' ? t.inquiry.consultTab : t.inquiry.visitTab}</h2>
      <p className="sc-form__intro">{type === 'consult' ? t.inquiry.consultIntro : t.inquiry.visitIntro}</p>
      <input type="hidden" name="type" value={type} />
      {productId && <input type="hidden" name="product" value={productId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="sc-visually-hidden" aria-hidden />
      <label>
        <span>{t.inquiry.name}</span>
        <input name="name" required maxLength={120} autoComplete="name" />
      </label>
      <label>
        <span>{t.inquiry.phone}</span>
        <input name="phone" required inputMode="tel" maxLength={30} autoComplete="tel" />
      </label>
      {type === 'visit' && (
        <div className="sc-form__row">
          <label>
            <span>{t.inquiry.date}</span>
            <input name="visitDate" type="date" />
          </label>
          <label>
            <span>{t.inquiry.time}</span>
            <input name="visitTime" placeholder="10h - 12h" maxLength={40} />
          </label>
        </div>
      )}
      <fieldset>
        <legend>{type === 'consult' ? t.inquiry.needs : t.inquiry.interests}</legend>
        {options.map((o) => (
          <label key={o} className="sc-form__check">
            <input type="checkbox" name="topics" value={o} />
            <span>{o}</span>
          </label>
        ))}
      </fieldset>
      <label>
        <span>{t.inquiry.note}</span>
        <textarea name="note" rows={3} maxLength={2000} defaultValue={productTitle ? `${productTitle}\n` : undefined} />
      </label>
      {state?.error && <p className="sc-form__error">{t.inquiry.invalid}</p>}
      <button type="submit" className="sc-btn sc-btn--dark" disabled={pending}>
        {pending ? t.inquiry.sending : t.inquiry.submit}
      </button>
    </form>
  )
}
