import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { vi } from '@payloadcms/translations/languages/vi'
import path from 'path'
import { buildConfig } from 'payload'
import { payloadTheme } from 'payload-theme'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Fabrics } from './collections/Fabrics'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PostCategories } from './collections/PostCategories'
import { Posts } from './collections/Posts'
import { ProductCategories } from './collections/ProductCategories'
import { ProductCollections } from './collections/ProductCollections'
import { Products } from './collections/Products'
import { Reviews } from './collections/Reviews'
import { Users } from './collections/Users'
import { HomePage } from './globals/HomePage'
import { SiteSettings } from './globals/SiteSettings'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const r2Enabled = Boolean(
  process.env.R2_ACCOUNT_ID &&
    process.env.R2_BUCKET &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
)
const r2PublicURL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '')

// The app goes through Neon's pooler; the CLI (migrations, import scripts) sets DB_DIRECT=1
// to use the direct host, which session-level features like advisory locks need.
const connectionString =
  (process.env.DB_DIRECT && process.env.DATABASE_URL_UNPOOLED) || process.env.DATABASE_URL || ''

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    dateFormat: 'dd/MM/yyyy HH:mm',
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Sochiu Studio',
      icons: [{ rel: 'icon', type: 'image/png', url: '/brand/favicon-32.png' }],
    },
  },
  // the admin menu follows this order (groups by their first collection)
  collections: [Products, ProductCategories, ProductCollections, Fabrics, Reviews, Inquiries, Posts, PostCategories, Pages, Media, Users],
  globals: [HomePage, SiteSettings],
  localization: {
    locales: [
      { code: 'vi', label: 'Tiếng Việt' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'vi',
    fallback: true,
  },
  i18n: {
    supportedLanguages: { vi, en },
    fallbackLanguage: 'vi',
    translations: { vi: { version: { publishChanges: 'Xuất bản' } } },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: {
      connectionString: connectionString.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/, '$1verify-full'),
      max: 10,
      idleTimeoutMillis: 10_000,
      // Neon suspends an idle database; waking it can take several seconds
      connectionTimeoutMillis: 20_000,
    },
    // schema changes only through migrations (src/migrations)
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    payloadTheme({
      accent: '#2E2B2B',
      radius: 'md',
      font: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
      logo: { light: '/brand/logo.png', dark: '/brand/logo-white.png' },
      logoHeight: 18,
      icon: '/brand/icon.png',
      login: {
        heading: 'Sochiu Studio',
        tagline: 'Quản lý sản phẩm, thư viện vải và nội dung website.',
      },
      nav: {
        icons: {
          products: 'sofa',
          'product-categories': 'layout-grid',
          'product-collections': 'layers',
          fabrics: 'swatch-book',
          reviews: 'star',
          inquiries: 'message-square-text',
          posts: 'newspaper',
          'post-categories': 'folder',
          pages: 'file-text',
          media: 'image',
          users: 'user-round',
          'site-settings': 'settings',
          'home-page': 'house',
        },
      },
    }),
    s3Storage({
      enabled: r2Enabled,
      alwaysInsertFields: true,
      collections: {
        media: {
          prefix: 'media',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) => `${r2PublicURL}/${prefix ? `${prefix}/` : ''}${filename}`,
        },
      },
      bucket: process.env.R2_BUCKET || '',
      config: {
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        // R2 doesn't support the newer default checksum headers of AWS SDK v3
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      },
    }),
  ],
})
