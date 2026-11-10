'use server'

import { headers } from 'next/headers'

import { getClient } from '@/lib/payload'

export type InquiryState = { ok: boolean; error?: string } | null

const clean = (v: FormDataEntryValue | null, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** The product page's "Nhận tư vấn" / "Đặt lịch ghé Showroom" forms -> Inquiries (admin). */
export async function sendInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  // a field people don't see: bots fill it in
  if (clean(form.get('website'))) return { ok: true }
  const name = clean(form.get('name'), 120)
  const phone = clean(form.get('phone'), 30)
  if (!name || phone.replace(/\D/g, '').length < 9) return { ok: false, error: 'invalid' }

  const type = form.get('type') === 'visit' ? 'visit' : 'consult'
  const product = Number(form.get('product')) || undefined
  const visitDate = clean(form.get('visitDate'), 20)
  const payload = await getClient()
  await payload.create({
    collection: 'inquiries',
    overrideAccess: true,
    data: {
      type,
      name,
      phone,
      topics: form.getAll('topics').map((t) => clean(t, 80)).filter(Boolean).slice(0, 10),
      visitDate: visitDate && !Number.isNaN(Date.parse(visitDate)) ? new Date(visitDate).toISOString() : undefined,
      visitTime: clean(form.get('visitTime'), 40) || undefined,
      note: clean(form.get('note'), 2000) || undefined,
      product,
      page: clean((await headers()).get('referer'), 300) || undefined,
    },
  })
  return { ok: true }
}
