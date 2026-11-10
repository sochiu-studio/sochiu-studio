import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '@/access'

/** "Nhận tư vấn chi tiết" and "Đặt lịch ghé Showroom" from the product page's popup. Written by
 *  the site (server action, overrideAccess); read and handled by the team in the admin. */
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: { vi: 'Yêu cầu tư vấn', en: 'Inquiry' }, plural: { vi: 'Yêu cầu tư vấn', en: 'Inquiries' } },
  defaultSort: '-createdAt',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'type', 'product', 'status', 'createdAt'],
    group: { vi: 'Khách hàng', en: 'Customers' },
  },
  access: { read: authenticated, create: authenticated, update: authenticated, delete: adminOnly },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          label: { vi: 'Loại', en: 'Type' },
          type: 'select',
          required: true,
          defaultValue: 'consult',
          options: [
            { label: { vi: 'Tư vấn', en: 'Consultation' }, value: 'consult' },
            { label: { vi: 'Ghé showroom', en: 'Showroom visit' }, value: 'visit' },
          ],
        },
        {
          name: 'status',
          label: { vi: 'Trạng thái', en: 'Status' },
          type: 'select',
          defaultValue: 'new',
          options: [
            { label: { vi: 'Mới', en: 'New' }, value: 'new' },
            { label: { vi: 'Đã liên hệ', en: 'Contacted' }, value: 'contacted' },
            { label: { vi: 'Xong', en: 'Done' }, value: 'done' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: { vi: 'Họ tên', en: 'Name' }, type: 'text', required: true },
        { name: 'phone', label: { vi: 'Điện thoại / Zalo', en: 'Phone / Zalo' }, type: 'text', required: true },
      ],
    },
    {
      name: 'topics',
      label: { vi: 'Cần tư vấn / quan tâm', en: 'Topics' },
      type: 'text',
      hasMany: true,
    },
    {
      type: 'row',
      fields: [
        { name: 'visitDate', label: { vi: 'Ngày ghé', en: 'Visit date' }, type: 'date' },
        { name: 'visitTime', label: { vi: 'Khung giờ', en: 'Time' }, type: 'text' },
      ],
    },
    { name: 'note', label: { vi: 'Ghi chú', en: 'Note' }, type: 'textarea' },
    {
      name: 'product',
      label: { vi: 'Sản phẩm', en: 'Product' },
      type: 'relationship',
      relationTo: 'products',
      admin: { position: 'sidebar' },
    },
    { name: 'page', label: { vi: 'Gửi từ trang', en: 'Sent from' }, type: 'text', admin: { position: 'sidebar', readOnly: true } },
  ],
}
