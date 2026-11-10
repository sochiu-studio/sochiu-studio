import type { CollectionConfig } from 'payload'

import { authenticated, publishedOrStaff } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'
import { seoField, slugField, wpIdField } from '@/fields/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: { vi: 'Sản phẩm', en: 'Product' }, plural: { vi: 'Sản phẩm', en: 'Products' } },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['images', 'title', 'category', 'priceFrom', '_status', 'updatedAt'],
    group: { vi: 'Cửa hàng', en: 'Shop' },
    listSearchableFields: ['title', 'slug'],
  },
  versions: { drafts: true, maxPerDoc: 20 },
  hooks: { afterChange: [revalidateAfterChange], afterDelete: [revalidateAfterDelete] },
  access: { read: publishedOrStaff, create: authenticated, update: authenticated, delete: authenticated },
  fields: [
    { name: 'title', label: { vi: 'Tên sản phẩm', en: 'Name' }, type: 'text', required: true, localized: true },
    {
      type: 'tabs',
      tabs: [
        {
          label: { vi: 'Thông tin', en: 'Details' },
          fields: [
            {
              name: 'images',
              label: { vi: 'Ảnh sản phẩm', en: 'Images' },
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: { description: { vi: 'Ảnh đầu tiên là ảnh đại diện.', en: 'The first image is the cover.' } },
            },
            {
              name: 'detailImages',
              label: { vi: 'Ảnh chi tiết', en: 'Detail images' },
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              admin: {
                description: {
                  vi: 'Dải ảnh dọc hiện dưới phần mô tả.',
                  en: 'The tall images shown below the description.',
                },
              },
            },
            {
              name: 'shortDescription',
              label: { vi: 'Mô tả ngắn', en: 'Short description' },
              type: 'textarea',
              localized: true,
            },
            { name: 'description', label: { vi: 'Mô tả', en: 'Description' }, type: 'richText', localized: true },
            {
              name: 'specs',
              label: { vi: 'Thông số', en: 'Specifications' },
              type: 'array',
              admin: { initCollapsed: true },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: { vi: 'Mục', en: 'Label' }, type: 'text', required: true, localized: true },
                    { name: 'value', label: { vi: 'Giá trị', en: 'Value' }, type: 'text', required: true, localized: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: { vi: 'Giá & tuỳ chọn', en: 'Pricing & options' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'priceFrom',
                  label: { vi: 'Giá từ (₫)', en: 'Price from (₫)' },
                  type: 'number',
                  min: 0,
                  admin: { description: { vi: 'Giá thấp nhất của các tuỳ chọn.', en: 'Lowest option price.' } },
                },
                { name: 'priceTo', label: { vi: 'Giá đến (₫)', en: 'Price to (₫)' }, type: 'number', min: 0 },
              ],
            },
            {
              name: 'options',
              label: { vi: 'Thuộc tính', en: 'Attributes' },
              type: 'array',
              labels: { singular: { vi: 'Thuộc tính', en: 'Attribute' }, plural: { vi: 'Thuộc tính', en: 'Attributes' } },
              admin: {
                description: { vi: 'vd. Màu sắc, Màu gỗ, Phân loại', en: 'e.g. Colour, Wood colour, Type' },
              },
              fields: [
                { name: 'name', label: { vi: 'Tên thuộc tính', en: 'Name' }, type: 'text', required: true, localized: true },
                {
                  name: 'values',
                  label: { vi: 'Giá trị', en: 'Values' },
                  type: 'array',
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'label', label: { vi: 'Tên', en: 'Label' }, type: 'text', required: true },
                        { name: 'value', label: { vi: 'Mã', en: 'Key' }, type: 'text', required: true },
                        { name: 'color', label: { vi: 'Màu (hex)', en: 'Colour (hex)' }, type: 'text' },
                      ],
                    },
                    { name: 'fabric', label: { vi: 'Vải', en: 'Fabric' }, type: 'relationship', relationTo: 'fabrics' },
                    { name: 'image', label: { vi: 'Ảnh mẫu', en: 'Swatch image' }, type: 'upload', relationTo: 'media' },
                  ],
                },
              ],
            },
            {
              name: 'variants',
              label: { vi: 'Biến thể', en: 'Variants' },
              type: 'array',
              labels: { singular: { vi: 'Biến thể', en: 'Variant' }, plural: { vi: 'Biến thể', en: 'Variants' } },
              admin: {
                initCollapsed: true,
                description: {
                  vi: 'Mỗi tổ hợp thuộc tính có giá / ảnh riêng. "Mã thuộc tính" ghép các Mã ở trên, vd. "almond-greige".',
                  en: 'Each option combination with its own price / image. "Option keys" joins the keys above.',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'optionValues', label: { vi: 'Mã thuộc tính', en: 'Option keys' }, type: 'text', required: true },
                    { name: 'sku', label: 'SKU', type: 'text' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'price', label: { vi: 'Giá (₫)', en: 'Price (₫)' }, type: 'number', min: 0 },
                    { name: 'salePrice', label: { vi: 'Giá khuyến mãi (₫)', en: 'Sale price (₫)' }, type: 'number', min: 0 },
                    { name: 'inStock', label: { vi: 'Còn hàng', en: 'In stock' }, type: 'checkbox', defaultValue: true },
                  ],
                },
                { name: 'image', label: { vi: 'Ảnh', en: 'Image' }, type: 'upload', relationTo: 'media' },
                { name: 'wpId', type: 'number', admin: { hidden: true } },
              ],
            },
          ],
        },
        { label: 'SEO', fields: [seoField] },
      ],
    },
    {
      name: 'category',
      label: { vi: 'Danh mục', en: 'Category' },
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'materials',
      label: { vi: 'Chất liệu (bộ lọc)', en: 'Materials (shop filter)' },
      type: 'select',
      hasMany: true,
      options: [
        { label: { vi: 'Vải', en: 'Fabric' }, value: 'fabric' },
        { label: { vi: 'Da', en: 'Leather' }, value: 'leather' },
        { label: { vi: 'Gỗ', en: 'Wood' }, value: 'wood' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      label: { vi: 'Nổi bật (trang chủ)', en: 'Featured (home page)' },
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    {
      name: 'related',
      label: { vi: 'Sản phẩm liên quan', en: 'Related products' },
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    slugField(),
    wpIdField,
  ],
}
