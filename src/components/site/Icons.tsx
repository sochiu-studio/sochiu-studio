import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P): P => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  ...p,
})

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
)
export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />
  </svg>
)
export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const ChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="m15 5-7 7 7 7" />
  </svg>
)
export const ChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)
export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)
export const PhoneIcon = (p: P) => (
  <svg {...base({ strokeWidth: 1.6, ...p })}>
    <path d="M5 4h3.5l1.8 4.4-2.2 1.4a11 11 0 0 0 6.1 6.1l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z" />
    <path d="M14.5 3.5a6 6 0 0 1 6 6M14.5 7a2.5 2.5 0 0 1 2.5 2.5" />
  </svg>
)
export const FacebookIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M20 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8.6v-7.7H10v-3h2.6V9.1c0-2.6 1.6-4 3.9-4 1.1 0 2 .1 2.3.1v2.7h-1.6c-1.3 0-1.5.6-1.5 1.5v1.9h3l-.4 3h-2.6V22H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" />
  </svg>
)
export const InstagramIcon = (p: P) => (
  <svg {...base({ strokeWidth: 1.8, ...p })}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.3" cy="6.7" r=".6" fill="currentColor" />
  </svg>
)
export const TiktokIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M16.6 2h-3.3v13.3a2.9 2.9 0 1 1-2.1-2.8V9.1a6.3 6.3 0 1 0 5.4 6.2V8.6a7.9 7.9 0 0 0 4.4 1.4V6.7a4.5 4.5 0 0 1-4.4-4.7Z" />
  </svg>
)
/** Messenger: the speech bubble with its zigzag, in one colour */
export const MessengerIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M12 2.2C6.5 2.2 2.2 6.2 2.2 11.5c0 2.8 1.2 5.2 3.2 6.9v3.4l3.1-1.7c1.1.3 2.3.5 3.5.5 5.5 0 9.8-4 9.8-9.3S17.5 2.2 12 2.2Zm1 12.4-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7Z" />
  </svg>
)
/** Zalo: a rounded speech bubble around the "Z" of the wordmark, in one colour */
export const ZaloIcon = (p: P) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden {...p}>
    <path
      d="M12 3c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-1 0-2-.1-2.9-.4L5.2 20l.9-3.4C4.2 15.2 3 13.1 3 10.7 3 6.4 7 3 12 3Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    <path d="M8.6 8h6.6l-6.6 5.6h6.8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
