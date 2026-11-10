import { type JSXConvertersFunction, RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from 'lexical'

import type { Media } from '@/payload-types'

import { Img } from './Img'

// images straight from R2 with their sizes; site links stay relative
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  upload: ({ node }) => {
    const value = node.value as Media | number
    if (typeof value !== 'object') return null
    return <Img media={value} sizes="(max-width: 767px) 100vw, 720px" size="large" className="sc-rich__img" />
  },
})

export function RichText({ data, className }: { data?: unknown; className?: string }) {
  if (!data || typeof data !== 'object') return null
  return <LexicalRichText data={data as SerializedEditorState} converters={converters} className={`sc-rich ${className ?? ''}`} />
}
