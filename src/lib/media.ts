import type { Media } from '@/payload-types'

export type MediaLike = Media | number | null | undefined

export const asMedia = (m: MediaLike): Media | null => (m && typeof m === 'object' ? m : null)

/** srcSet from the sizes Payload made at upload (400 / 800 / 1600 / original), so the browser
 *  picks the smallest that is sharp enough - no image optimiser in between. */
export function srcSet(m: Media): string | undefined {
  const entries = [m.sizes?.thumb, m.sizes?.card, m.sizes?.large]
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.url && s.width))
    .map((s) => `${s.url} ${s.width}w`)
  if (m.url && m.width) entries.push(`${m.url} ${m.width}w`)
  return entries.length ? entries.join(', ') : undefined
}

/** A size's URL, falling back to the next larger one and then the original. */
export function sizeUrl(m: Media, size: 'thumb' | 'card' | 'large'): string {
  const order = ['thumb', 'card', 'large'] as const
  for (const s of order.slice(order.indexOf(size))) {
    const url = m.sizes?.[s]?.url
    if (url) return url
  }
  return m.url || ''
}

/** A plain object for client components (no Payload types across the boundary). */
export type Pic = { src: string; srcSet?: string; width?: number; height?: number; alt: string }

export function toPic(media: MediaLike, alt?: string, size: 'thumb' | 'card' | 'large' = 'large'): Pic | null {
  const m = asMedia(media)
  if (!m?.url) return null
  return { src: sizeUrl(m, size), srcSet: srcSet(m), width: m.width ?? undefined, height: m.height ?? undefined, alt: alt ?? m.alt ?? '' }
}
