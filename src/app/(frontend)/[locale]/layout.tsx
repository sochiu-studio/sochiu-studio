import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { FloatingContact } from '@/components/site/FloatingContact'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { Reveal } from '@/components/site/Reveal'
import { isLocale, locales } from '@/i18n/config'
import { dict } from '@/i18n/dict'
import { getClient } from '@/lib/payload'
import { siteUrl } from '@/lib/site-url'

import '../styles.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter', display: 'swap' })

export const generateStaticParams = () => locales.map((locale) => ({ locale }))

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Sochiu Studio', template: '%s - Sochiu Studio' },
  icons: { icon: '/brand/favicon-32.png', apple: '/brand/icon.png' },
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const t = dict(locale)
  const payload = await getClient()
  const settings = await payload.findGlobal({ slug: 'site-settings', locale, depth: 1 })

  return (
    <html lang={locale} className={inter.variable}>
      <body>
        <Header locale={locale} t={t} />
        <main id="content">{children}</main>
        <Footer locale={locale} t={t} settings={settings} />
        <Reveal />
        <FloatingContact
          t={t}
          hotline={settings.hotline}
          zalo={settings.socials?.zalo}
          messenger={settings.socials?.messenger}
        />
      </body>
    </html>
  )
}
