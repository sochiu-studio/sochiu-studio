import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrStaff } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { seoField, slugField, wpIdField } from '@/fields/slug'

/** Simple content pages: about, policies, FAQ, showroom... */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: { vi: 'Trang', en: 'Page' }, plural: { vi: 'Trang', en: 'Pages' } },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: { vi: 'Nội dung', en: 'Content' },
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: publishedOrStaff, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tiêu đề', en: 'Title' }, type: 'text', required: true, localized: true },
    { name: 'hero', label: { vi: 'Ảnh đầu trang', en: 'Hero image' }, type: 'upload', relationTo: 'media' },
    { name: 'content', label: { vi: 'Nội dung', en: 'Content' }, type: 'richText', localized: true },
    {
      name: 'sections',
      label: { vi: 'Khối ảnh & chữ', en: 'Image & text sections' },
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'image', label: { vi: 'Ảnh', en: 'Image' }, type: 'upload', relationTo: 'media' },
        { name: 'heading', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'textarea', localized: true },
        { name: 'body', label: { vi: 'Nội dung', en: 'Text' }, type: 'textarea', localized: true },
        {
          type: 'row',
          fields: [
            { name: 'buttonLabel', label: { vi: 'Nút', en: 'Button' }, type: 'text', localized: true },
            { name: 'buttonUrl', label: { vi: 'Đường dẫn', en: 'Link' }, type: 'text' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'imageSide',
              label: { vi: 'Ảnh bên', en: 'Image side' },
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: { vi: 'Trái', en: 'Left' }, value: 'left' },
                { label: { vi: 'Phải', en: 'Right' }, value: 'right' },
              ],
            },
            {
              name: 'background',
              label: { vi: 'Nền', en: 'Background' },
              type: 'select',
              defaultValue: 'white',
              options: [
                { label: { vi: 'Trắng', en: 'White' }, value: 'white' },
                { label: { vi: 'Kem', en: 'Cream' }, value: 'cream' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'pdf',
      label: { vi: 'Tài liệu PDF', en: 'PDF document' },
      type: 'upload',
      relationTo: 'media',
      admin: { description: { vi: 'Hiện ngay trên trang (vd. Chính sách).', en: 'Shown on the page (e.g. Policies).' } },
    },
    {
      name: 'faqs',
      label: { vi: 'Câu hỏi thường gặp', en: 'FAQs' },
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'group', label: { vi: 'Nhóm', en: 'Group' }, type: 'text', localized: true },
        { name: 'question', label: { vi: 'Câu hỏi', en: 'Question' }, type: 'text', required: true, localized: true },
        { name: 'answer', label: { vi: 'Trả lời', en: 'Answer' }, type: 'richText', localized: true },
      ],
    },
    seoField,
    slugField('title', { localized: true }),
    wpIdField,
  ],
}
