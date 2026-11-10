import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { wpIdField } from '@/fields/slug'

/** Đánh giá từ khách hàng (trang "Review từ khách hàng" và trang sản phẩm). */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: { vi: 'Đánh giá', en: 'Review' }, plural: { vi: 'Đánh giá khách hàng', en: 'Reviews' } },
  defaultSort: '-date',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['images', 'title', 'customerName', 'product', 'date'],
    group: { vi: 'Cửa hàng', en: 'Shop' },
  },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tiêu đề', en: 'Title' }, type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        { name: 'customerName', label: { vi: 'Tên khách', en: 'Customer' }, type: 'text', required: true },
        { name: 'location', label: { vi: 'Ghi chú', en: 'Note' }, type: 'text', localized: true },
        { name: 'rating', label: { vi: 'Số sao', en: 'Rating' }, type: 'number', min: 0, max: 5 },
      ],
    },
    { name: 'content', label: { vi: 'Nội dung', en: 'Review' }, type: 'textarea', localized: true },
    { name: 'images', label: { vi: 'Ảnh', en: 'Photos' }, type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'videoUrl', label: { vi: 'Link video', en: 'Video link' }, type: 'text' },
    {
      name: 'productName',
      label: { vi: 'Tên sản phẩm', en: 'Product name' },
      type: 'text',
      localized: true,
      admin: {
        position: 'sidebar',
        description: { vi: 'Hiện khi không chọn sản phẩm (đồ đặt riêng).', en: 'Shown when no product is linked (custom pieces).' },
      },
    },
    {
      name: 'product',
      label: { vi: 'Sản phẩm', en: 'Product' },
      type: 'relationship',
      relationTo: 'products',
      admin: { position: 'sidebar' },
    },
    { name: 'date', label: { vi: 'Ngày', en: 'Date' }, type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'featured',
      label: { vi: 'Hiện ở trang chủ', en: 'Show on home page' },
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    wpIdField,
  ],
}
