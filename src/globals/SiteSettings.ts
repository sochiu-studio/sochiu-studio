import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateGlobal } from '@/hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: { vi: 'Cài đặt website', en: 'Site settings' },
  admin: { group: { vi: 'Hệ thống', en: 'System' } },
  hooks: { afterChange: [revalidateGlobal] },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: { vi: 'Liên hệ', en: 'Contact' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'hotline', label: 'Hotline', type: 'text', defaultValue: '0878788555' },
                { name: 'email', label: 'Email', type: 'email' },
              ],
            },
            {
              name: 'socials',
              label: { vi: 'Mạng xã hội', en: 'Social links' },
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'facebook', type: 'text', defaultValue: 'https://www.facebook.com/livingsochiu' },
                    { name: 'messenger', type: 'text', defaultValue: 'https://m.me/livingsochiu' },
                    { name: 'zalo', type: 'text', defaultValue: 'https://zalo.me/0878788555' },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'instagram', type: 'text', defaultValue: 'https://www.instagram.com/sochiu_studio/' },
                    { name: 'tiktok', type: 'text', defaultValue: 'https://www.tiktok.com/@sochiustudio' },
                  ],
                },
              ],
            },
            {
              name: 'showrooms',
              label: 'Showroom',
              type: 'array',
              fields: [
                { name: 'name', label: { vi: 'Tên', en: 'Name' }, type: 'text', required: true, localized: true },
                { name: 'address', label: { vi: 'Địa chỉ', en: 'Address' }, type: 'text', localized: true },
                { name: 'hours', label: { vi: 'Giờ mở cửa', en: 'Opening hours' }, type: 'text', localized: true },
                { name: 'mapUrl', label: { vi: 'Link Google Maps', en: 'Google Maps link' }, type: 'text' },
                {
                  name: 'mapEmbed',
                  label: { vi: 'Bản đồ nhúng (link embed)', en: 'Map embed URL' },
                  type: 'text',
                  admin: { description: { vi: 'Google Maps > Chia sẻ > Nhúng bản đồ > lấy link trong src="…".', en: 'Google Maps > Share > Embed > the src link.' } },
                },
                { name: 'image', label: { vi: 'Ảnh', en: 'Image' }, type: 'upload', relationTo: 'media' },
              ],
            },
          ],
        },
        {
          label: { vi: 'Trang sản phẩm', en: 'Product page' },
          fields: [
            {
              name: 'productInfoTabs',
              label: { vi: 'Tab thông tin chung', en: 'Shared info tabs' },
              type: 'array',
              admin: {
                description: {
                  vi: 'Hiện sau tab "Mô tả" ở mọi sản phẩm (Lưu ý, Vận chuyển, Chính sách…).',
                  en: 'Shown after "Description" on every product.',
                },
              },
              fields: [
                { name: 'title', label: { vi: 'Tên tab', en: 'Tab' }, type: 'text', required: true, localized: true },
                { name: 'content', label: { vi: 'Nội dung', en: 'Content' }, type: 'richText', localized: true },
              ],
            },
          ],
        },
        {
          label: { vi: 'Đầu & chân trang', en: 'Header & footer' },
          fields: [
            {
              name: 'announcement',
              label: { vi: 'Thanh thông báo', en: 'Announcement bar' },
              type: 'text',
              localized: true,
            },
            {
              name: 'footerAbout',
              label: { vi: 'Giới thiệu ở chân trang', en: 'Footer blurb' },
              type: 'textarea',
              localized: true,
            },
            {
              name: 'businessInfo',
              label: { vi: 'Thông tin doanh nghiệp', en: 'Business details' },
              type: 'textarea',
              localized: true,
              admin: { description: { vi: 'Mỗi thông tin một dòng: tên công ty, địa chỉ, người đại diện, mã số ĐKKD.', en: 'One per line: company, address, representative, registration no.' } },
            },
          ],
        },
      ],
    },
  ],
}
