import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { slugField, wpIdField } from '@/fields/slug'

export const PostCategories: CollectionConfig = {
  slug: 'post-categories',
  labels: {
    singular: { vi: 'Chuyên mục', en: 'Post category' },
    plural: { vi: 'Chuyên mục bài viết', en: 'Post categories' },
  },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug'], group: { vi: 'Nội dung', en: 'Content' } },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tên', en: 'Name' }, type: 'text', required: true, localized: true },
    {
      name: 'image',
      label: { vi: 'Ảnh (ô ở trang chủ)', en: 'Image (home page tile)' },
      type: 'upload',
      relationTo: 'media',
    },
    slugField('title', { localized: true }),
    wpIdField,
  ],
}
