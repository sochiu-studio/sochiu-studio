import 'server-only'

import { cache } from 'react'

import type { Locale } from '@/i18n/config'

import { getClient } from './payload'

/** A content page by its Vietnamese slug, in the page's language (folders are named in Vietnamese). */
export const getPage = cache(async (viSlug: string, locale: Locale) => {
  const payload = await getClient()
  const { docs } = await payload.find({ collection: 'pages', locale: 'vi', where: { slug: { equals: viSlug } }, limit: 1, depth: 0 })
  if (!docs[0]) return null
  return payload.findByID({ collection: 'pages', id: docs[0].id, locale, depth: 2 })
})
