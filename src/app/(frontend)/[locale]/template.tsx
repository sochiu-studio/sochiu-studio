import type { ReactNode } from 'react'

/** A template re-mounts on every navigation (a layout doesn't): each new page fades in, like the
 *  old site's Elementor fadeIn. Header and footer live in the layout and stay put. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="sc-page-enter">{children}</div>
}
