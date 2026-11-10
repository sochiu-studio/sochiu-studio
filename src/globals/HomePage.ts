import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

const link = (name: string, label: { vi: string; en: string }) => ({
  type: 'row' as const,
  fields: [
    { name: `${name}Label`, label: label, type: 'text' as const, localized: true },
    {
      name: `${name}Url`,
      label: { vi: 'Đường dẫn', en: 'Link' },
      type: 'text' as const,
      admin: { placeholder: '/bo-suu-tap/' },
    },
  ],
})

/** The home page's sections, in their order on the page. Products and reviews come from their
 *  own collections; this holds the pictures and words around them. */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: { vi: 'Trang chủ', en: 'Home page' },
  admin: { group: { vi: 'Nội dung', en: 'Content' } },
  hooks: { afterChange: [revalidateGlobal] },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Banner',
          fields: [
            {
              name: 'slides',
              label: { vi: 'Ảnh banner', en: 'Slides' },
              type: 'array',
              labels: { singular: { vi: 'Ảnh', en: 'Slide' }, plural: { vi: 'Ảnh', en: 'Slides' } },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'image',
                      label: { vi: 'Ảnh (máy tính)', en: 'Image (desktop)' },
                      type: 'upload',
                      relationTo: 'media',
                      required: true,
                    },
                    {
                      name: 'mobileImage',
                      label: { vi: 'Ảnh (điện thoại)', en: 'Image (mobile)' },
                      type: 'upload',
                      relationTo: 'media',
                      admin: { description: { vi: 'Ảnh dọc; để trống dùng ảnh máy tính.', en: 'Portrait; falls back to desktop.' } },
                    },
                  ],
                },
                { name: 'url', label: { vi: 'Đường dẫn khi bấm', en: 'Link' }, type: 'text' },
                { name: 'alt', label: { vi: 'Mô tả ảnh', en: 'Alt text' }, type: 'text', localized: true },
              ],
            },
          ],
        },
        {
          label: { vi: 'Sản phẩm', en: 'Products' },
          fields: [
            { name: 'productsTitle', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'text', localized: true },
            {
              name: 'productTabs',
              label: { vi: 'Các tab danh mục', en: 'Category tabs' },
              type: 'relationship',
              relationTo: 'product-categories',
              hasMany: true,
              admin: { description: { vi: 'Để trống: tất cả danh mục theo thứ tự.', en: 'Empty: every category in order.' } },
            },
          ],
        },
        {
          label: 'Catalogue',
          fields: [
            { name: 'catalogueImage', label: { vi: 'Ảnh', en: 'Image' }, type: 'upload', relationTo: 'media' },
            { name: 'catalogueEyebrow', label: { vi: 'Dòng nhỏ', en: 'Eyebrow' }, type: 'text', localized: true },
            { name: 'catalogueTitle', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'textarea', localized: true },
            link('catalogueButton', { vi: 'Nút', en: 'Button' }),
          ],
        },
        {
          label: { vi: 'Thư viện', en: 'Library' },
          fields: [
            { name: 'libraryTitle', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'text', localized: true },
            {
              name: 'libraryCategories',
              label: { vi: 'Chuyên mục', en: 'Categories' },
              type: 'relationship',
              relationTo: 'post-categories',
              hasMany: true,
              admin: { description: { vi: 'Mỗi chuyên mục là một ô (ảnh lấy từ chuyên mục).', en: 'One tile each.' } },
            },
          ],
        },
        {
          label: { vi: 'Thư viện vải', en: 'Fabric' },
          fields: [
            { name: 'fabricImage', label: { vi: 'Ảnh nền', en: 'Background' }, type: 'upload', relationTo: 'media' },
            { name: 'fabricTitle', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'text', localized: true },
            { name: 'fabricText', label: { vi: 'Mô tả', en: 'Text' }, type: 'textarea', localized: true },
            link('fabricButton', { vi: 'Nút', en: 'Button' }),
          ],
        },
        {
          label: { vi: 'Nguồn cảm hứng', en: 'Inspiration' },
          fields: [
            { name: 'inspirationTitle', label: { vi: 'Tiêu đề', en: 'Heading' }, type: 'text', localized: true },
            { name: 'inspirationText', label: { vi: 'Mô tả', en: 'Text' }, type: 'textarea', localized: true },
            link('inspirationButton', { vi: 'Nút', en: 'Button' }),
          ],
        },
      ],
    },
  ],
}
