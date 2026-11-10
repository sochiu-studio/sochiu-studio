import type { Pic as PicData } from '@/lib/media'

/** Renders a plain picture object (from toPic) - usable in client components. */
export function Pic({ pic, sizes, className, priority }: { pic: PicData | null; sizes: string; className?: string; priority?: boolean }) {
  if (!pic) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element -- R2 serves ready-made sizes
    <img
      src={pic.src}
      srcSet={pic.srcSet}
      sizes={sizes}
      alt={pic.alt}
      width={pic.width}
      height={pic.height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}
