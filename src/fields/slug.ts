import type { Field, FieldHook } from 'payload'

/** "Ghế ăn Kai" -> "ghe-an-kai" (Vietnamese marks and đ removed). */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const fromTitle =
  (source: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    // an update that doesn't touch the slug (e.g. saving the English title) keeps it
    if (typeof originalDoc?.slug === 'string' && originalDoc.slug) return originalDoc.slug
    const title = data?.[source] ?? originalDoc?.[source]
    // a localized title arrives as the current locale's string
    return typeof title === 'string' ? slugify(title) : value
  }

/** URL slug, filled from `source` when left empty. Shared by both languages unless `localized`
 *  (posts and pages have their own English URL on the old site: /en/<english-slug>/). */
export const slugField = (source = 'title', { localized = false }: { localized?: boolean } = {}): Field => ({
  name: 'slug',
  localized,
  label: { vi: 'Đường dẫn (slug)', en: 'Slug' },
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: { vi: 'Để trống sẽ tự tạo từ tên.', en: 'Left empty, it is made from the title.' },
  },
  hooks: { beforeValidate: [fromTitle(source)] },
})

/** SEO title/description/image, per language. */
export const seoField: Field = {
  name: 'meta',
  label: 'SEO',
  type: 'group',
  fields: [
    { name: 'title', label: { vi: 'Tiêu đề SEO', en: 'SEO title' }, type: 'text', localized: true },
    {
      name: 'description',
      label: { vi: 'Mô tả SEO', en: 'SEO description' },
      type: 'textarea',
      localized: true,
    },
    { name: 'image', label: { vi: 'Ảnh chia sẻ', en: 'Share image' }, type: 'upload', relationTo: 'media' },
  ],
}

/** The id of the record on the old WordPress site, for re-running the import. */
export const wpIdField: Field = {
  name: 'wpId',
  label: 'WordPress ID',
  type: 'number',
  index: true,
  admin: { position: 'sidebar', readOnly: true },
}
