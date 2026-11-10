import type { Media } from '@/payload-types'

import { asMedia, type MediaLike, sizeUrl, srcSet } from '@/lib/media'

type Props = {
  media: MediaLike
  /** the image's rendered width, for the browser to pick from the srcSet */
  sizes: string
  className?: string
  alt?: string
  priority?: boolean
  size?: 'thumb' | 'card' | 'large'
}

/** A Payload image straight from R2, with the sizes made at upload as its srcSet. */
export function Img({ media, sizes, className, alt, priority, size = 'card' }: Props) {
  const m: Media | null = asMedia(media)
  if (!m?.url) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element -- R2 serves ready-made sizes
    <img
      src={sizeUrl(m, size)}
      srcSet={srcSet(m)}
      sizes={sizes}
      alt={alt ?? m.alt ?? ''}
      width={m.width ?? undefined}
      height={m.height ?? undefined}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
