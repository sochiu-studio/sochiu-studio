import type { CollectionConfig } from 'payload'

import { adminField, adminOnly, authenticated } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { vi: 'Quản trị viên', en: 'User' }, plural: { vi: 'Quản trị viên', en: 'Users' } },
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: { vi: 'Hệ thống', en: 'System' },
  },
  access: {
    read: authenticated,
    create: adminOnly,
    delete: adminOnly,
    update: ({ req, id }) => (req.user as { role?: string } | null)?.role === 'admin' || req.user?.id === id,
  },
  hooks: {
    // the account made on /admin/create-first-user runs the site: it is the first admin
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', req })
        return totalDocs === 0 ? { ...data, role: 'admin' } : data
      },
    ],
  },
  fields: [
    { name: 'name', label: { vi: 'Họ tên', en: 'Name' }, type: 'text' },
    {
      name: 'role',
      label: { vi: 'Vai trò', en: 'Role' },
      type: 'select',
      required: true,
      defaultValue: 'editor',
      saveToJWT: true,
      access: { create: adminField, update: adminField },
      options: [
        { label: { vi: 'Quản trị', en: 'Admin' }, value: 'admin' },
        { label: { vi: 'Biên tập', en: 'Editor' }, value: 'editor' },
      ],
    },
  ],
}
