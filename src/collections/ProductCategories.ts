import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { seoField, slugField, wpIdField } from '@/fields/slug'

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: { vi: 'Danh mục sản phẩm', en: 'Product category' },
    plural: { vi: 'Danh mục sản phẩm', en: 'Product categories' },
  },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    group: { vi: 'Cửa hàng', en: 'Shop' },
  },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tên', en: 'Name' }, type: 'text', required: true, localized: true },
    { name: 'image', label: { vi: 'Ảnh', en: 'Image' }, type: 'upload', relationTo: 'media' },
    { name: 'description', label: { vi: 'Mô tả', en: 'Description' }, type: 'textarea', localized: true },
    {
      name: 'order',
      label: { vi: 'Thứ tự', en: 'Order' },
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    slugField('title', { localized: true }),
    seoField,
    wpIdField,
  ],
}
