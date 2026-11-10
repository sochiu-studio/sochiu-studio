import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrStaff } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { seoField, slugField, wpIdField } from '@/fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: { vi: 'Bài viết', en: 'Post' }, plural: { vi: 'Bài viết', en: 'Posts' } },
  defaultSort: '-publishedAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['cover', 'title', 'categories', 'publishedAt', '_status'],
    group: { vi: 'Nội dung', en: 'Content' },
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: publishedOrStaff, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tiêu đề', en: 'Title' }, type: 'text', required: true, localized: true },
    { name: 'cover', label: { vi: 'Ảnh bìa', en: 'Cover image' }, type: 'upload', relationTo: 'media' },
    { name: 'excerpt', label: { vi: 'Tóm tắt', en: 'Excerpt' }, type: 'textarea', localized: true },
    { name: 'content', label: { vi: 'Nội dung', en: 'Content' }, type: 'richText', localized: true },
    seoField,
    {
      name: 'publishedAt',
      label: { vi: 'Ngày đăng', en: 'Published' },
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [({ value, siblingData }) => value ?? (siblingData._status === 'published' ? new Date() : value)],
      },
    },
    {
      name: 'categories',
      label: { vi: 'Chuyên mục', en: 'Categories' },
      type: 'relationship',
      relationTo: 'post-categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    slugField('title', { localized: true }),
    wpIdField,
  ],
}
