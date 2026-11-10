import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { slugField, wpIdField } from '@/fields/slug'

/** Thư viện vải: the fabrics and colours a sofa can be ordered in. */
export const Fabrics: CollectionConfig = {
  slug: 'fabrics',
  labels: { singular: { vi: 'Vải', en: 'Fabric' }, plural: { vi: 'Thư viện vải', en: 'Fabric library' } },
  defaultSort: 'order',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['swatch', 'name', 'line', 'color', 'order'],
    group: { vi: 'Cửa hàng', en: 'Shop' },
  },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: { vi: 'Tên màu', en: 'Colour name' }, type: 'text', required: true },
        { name: 'code', label: { vi: 'Mã vải', en: 'Code' }, type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'line',
          label: { vi: 'Dòng vải', en: 'Fabric line' },
          type: 'text',
          localized: true,
          admin: {
            description: { vi: 'vd. Vải thô tiêu chuẩn, Da Microfiber Premium', en: 'e.g. Standard Textured Fabric' },
          },
        },
        {
          name: 'color',
          label: { vi: 'Mã màu (hex)', en: 'Colour (hex)' },
          type: 'text',
          admin: { placeholder: '#D8CFC2' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'swatch', label: { vi: 'Ảnh mẫu vải', en: 'Swatch' }, type: 'upload', relationTo: 'media' },
        {
          name: 'thumbnail',
          label: { vi: 'Ảnh thu nhỏ', en: 'Thumbnail' },
          type: 'upload',
          relationTo: 'media',
          admin: { description: { vi: 'Ô vuông trong lưới; để trống dùng ảnh mẫu vải.', en: 'Grid square; falls back to the swatch.' } },
        },
      ],
    },
    { name: 'intro', label: { vi: 'Giới thiệu', en: 'Introduction' }, type: 'textarea', localized: true },
    {
      name: 'suitableFor',
      label: { vi: 'Phù hợp với', en: 'Best for' },
      type: 'textarea',
      localized: true,
    },
    {
      name: 'specs',
      label: { vi: 'Thông số', en: 'Specifications' },
      type: 'textarea',
      localized: true,
      admin: { description: { vi: 'Mỗi dòng một thông số, vd. "Định lượng: 270 g/m²".', en: 'One per line.' } },
    },
    {
      name: 'order',
      label: { vi: 'Thứ tự', en: 'Order' },
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    slugField('name'),
    wpIdField,
  ],
}
