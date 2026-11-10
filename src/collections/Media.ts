import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '@/access'
import { revalidateAfterChange, revalidateAfterDelete } from '@/hooks/revalidate'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: { vi: 'Ảnh', en: 'Media' }, plural: { vi: 'Thư viện ảnh', en: 'Media' } },
  defaultSort: '-createdAt',
  admin: {
    group: { vi: 'Hệ thống', en: 'System' },
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    pagination: { defaultLimit: 48, limits: [24, 48, 96] },
  },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: {
    // a new upload isn't shown anywhere yet; an edited or deleted one may be
    afterChange: [(args) => (args.operation === 'update' ? revalidateAfterChange(args) : args.doc)],
    afterDelete: [revalidateAfterDelete],
    // Folders in the R2 bucket (under media/): the import files images by what they belong to
    // (products/<slug>, fabrics, reviews, posts/<slug>); an upload from the admin goes in
    // uploads/<year>/<month> so the bucket's root never fills up.
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== 'create' || !req.file || !data || (typeof data.prefix === 'string' && data.prefix)) return data
        const now = new Date()
        return { ...data, prefix: `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}` }
      },
    ],
  },
  upload: {
    mimeTypes: ['image/*', 'video/mp4', 'application/pdf'],
    // Product photos are 1080x1350; banners up to ~2400px wide. Originals are capped and
    // re-encoded as webp before they reach R2.
    resizeOptions: { width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      { name: 'thumb', width: 400, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'card', width: 800, formatOptions: { format: 'webp', options: { quality: 80 } } },
      { name: 'large', width: 1600, formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      label: { vi: 'Mô tả ảnh (alt)', en: 'Alt text' },
      type: 'text',
      localized: true,
    },
    {
      // the file's URL on the old WordPress site: re-running the import reuses the upload
      name: 'sourceUrl',
      label: { vi: 'Nguồn (site cũ)', en: 'Source (old site)' },
      type: 'text',
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
