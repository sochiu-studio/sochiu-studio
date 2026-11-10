import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, PayloadRequest } from 'payload'

/**
 * Pages are prerendered and kept for 5 minutes (`revalidate = 300`); an edit in the admin
 * refreshes the whole public site at once instead. The site is small (~200 pages) and a page
 * shows data from many collections (the footer, related products, the home page's tabs…), so
 * one rule beats tracing who shows what. Pages rebuild on their next visit, not all at once.
 */
function refreshSite(req: PayloadRequest) {
  // a caller doing many writes can skip it and refresh once at the end
  if (req.context?.disableRevalidate) return
  try {
    revalidatePath('/', 'layout')
  } catch {
    // not inside a Next.js request (the import script): nothing is cached there to refresh
  }
}

/** After a save. A draft isn't on the site yet - unless it replaces a published version. */
export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
  const status = (doc as { _status?: string })._status
  const wasPublished = (previousDoc as { _status?: string } | undefined)?._status === 'published'
  if (status === 'draft' && !wasPublished) return doc
  refreshSite(req)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  refreshSite(req)
  return doc
}

export const revalidateGlobal: GlobalAfterChangeHook = ({ doc, req }) => {
  refreshSite(req)
  return doc
}
