import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { seoField, slugField, wpIdField } from '@/fields/slug'

/** Bộ sưu tập (Elton, Fuji Dining Set, Maison, Mellow): a family of products with its story. */
export const ProductCollections: CollectionConfig = {
  slug: 'product-collections',
  labels: { singular: { vi: 'Bộ sưu tập', en: 'Collection' }, plural: { vi: 'Bộ sưu tập', en: 'Collections' } },
  defaultSort: 'order',
  admin: { useAsTitle: 'title', defaultColumns: ['cover', 'title', 'order'], group: { vi: 'Cửa hàng', en: 'Shop' } },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tên', en: 'Name' }, type: 'text', required: true, localized: true },
    { name: 'cover', label: { vi: 'Ảnh bìa', en: 'Cover' }, type: 'upload', relationTo: 'media' },
    { name: 'tagline', label: { vi: 'Câu giới thiệu', en: 'Tagline' }, type: 'text', localized: true },
    { name: 'description', label: { vi: 'Giới thiệu', en: 'Story' }, type: 'textarea', localized: true },
    {
      name: 'gallery',
      label: { vi: 'Ảnh giới thiệu', en: 'Story images' },
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: { vi: 'Xếp dọc dưới danh sách sản phẩm.', en: 'Stacked below the products.' } },
    },
    {
      name: 'products',
      label: { vi: 'Sản phẩm', en: 'Products' },
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
    },
    { name: 'order', label: { vi: 'Thứ tự', en: 'Order' }, type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    seoField,
    slugField(),
    wpIdField,
  ],
}
