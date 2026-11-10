'use client'

import { useEffect, useSyncExternalStore } from 'react'

// The other language's URL of the page on screen, for the header's VN | EN switch. Pages whose
// slug differs per language (posts, content pages) declare it; the rest use translatePath.
let current: string | null = null
const listeners = new Set<() => void>()
const set = (v: string | null) => {
  current = v
  listeners.forEach((l) => l())
}

export function useAlternate() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )
}

export function SetAlternate({ href }: { href: string }) {
  useEffect(() => {
    set(href)
    return () => set(null)
  }, [href])
  return null
}
