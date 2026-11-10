/**
 * Import the old WordPress / WooCommerce site (sochiustudio.com) into Payload.
 *
 *   npm run import:wp                      # everything
 *   ONLY=fabrics,products npm run import:wp
 *   LIMIT=3 ONLY=products npm run import:wp  # a few products, to try it out
 *
 * Reads the site's public JSON (WP REST, Woo Store API) and the JSON its own pages embed
 * (fabric library, reviews). Re-runnable: documents are matched by their WordPress id
 * (`wpId`), images by their original URL (`media.sourceUrl`), so a second run updates in place
 * and never uploads a file twice. Responses are cached in .cache/wp (delete it to refetch).
 *
 * Steps run in dependency order: categories -> fabrics -> products -> posts -> reviews -> home
 * (the home page's banners and words, the footer's contact details, the blog tiles' pictures).
 */
import config from '@payload-config'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import crypto from 'crypto'
import fs from 'fs'
import { JSDOM } from 'jsdom'
import path from 'path'
import { getPayload, type Payload } from 'payload'

import { slugify } from '@/fields/slug'

const SITE = 'https://sochiustudio.com'
const UA = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/130 Safari/537.36'
const CACHE = path.resolve(process.cwd(), '.cache/wp')
const ONLY = new Set((process.env.ONLY || 'categories,fabrics,products,posts,reviews,home,tabs,materials,collections,pages').split(','))
const LIMIT = Number(process.env.LIMIT || 0) || Infinity
const CONCURRENCY = 6

fs.mkdirSync(CACHE, { recursive: true })

const payload: Payload = await getPayload({ config })
const log = (msg: string) => payload.logger.info(msg)
const editorConfig = await editorConfigFactory.default({ config: payload.config })

// ---------------------------------------------------------------------------------------------
// fetching

async function get(url: string, { json = true } = {}): Promise<any> {
  const full = url.startsWith('http') ? url : `${SITE}${url}`
  const key = crypto.createHash('md5').update(full).digest('hex')
  const file = path.join(CACHE, `${key}.${json ? 'json' : 'html'}`)
  if (fs.existsSync(file)) {
    const body = fs.readFileSync(file, 'utf8')
    return json ? JSON.parse(body) : body
  }
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(full, { headers: { 'User-Agent': UA } })
      if (!res.ok) throw new Error(`${res.status} ${full}`)
      const body = await res.text()
      fs.writeFileSync(file, body)
      return json ? JSON.parse(body) : body
    } catch (err) {
      if (attempt >= 3) throw err
      await new Promise((r) => setTimeout(r, 1000 * attempt))
    }
  }
}

/** Run `fn` over `items`, `limit` at a time, keeping the order of the results. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++
        out[i] = await fn(items[i], i)
      }
    }),
  )
  return out
}

// ---------------------------------------------------------------------------------------------
// text helpers

const decode = (s: string) => new JSDOM(`<!doctype html><body>${s}`).window.document.body.textContent || ''

/** HTML to plain text, keeping paragraph and <br> breaks as new lines. */
function htmlToText(html: string): string {
  const withBreaks = (html || '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h\d)>/gi, '\n')
    .replace(/<small>.*?<\/small>/gis, '')
  return decode(withBreaks)
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const absolute = (src: string) => (src.startsWith('http') ? src : `${SITE}${src.startsWith('/') ? '' : '/'}${src}`)

/** The original upload: WordPress serves resized copies as name-768x1024.jpg. */
const originalOf = (src: string) => absolute(src).replace(/-\d+x\d+(\.\w+)$/, '$1')

// ---------------------------------------------------------------------------------------------
// media

const mediaCache = new Map<string, Promise<number | null>>()

async function findMediaBySource(url: string): Promise<number | null> {
  const { docs } = await payload.find({
    collection: 'media',
    where: { sourceUrl: { equals: url } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ? (docs[0].id as number) : null
}

async function download(url: string): Promise<{ data: Buffer; mimetype: string } | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`${res.status}`)
      const mimetype = (res.headers.get('content-type') || 'image/jpeg').split(';')[0]
      return { data: Buffer.from(await res.arrayBuffer()), mimetype }
    } catch (err) {
      if (attempt === 3) {
        payload.logger.warn(`  ! download failed ${url}: ${(err as Error).message}`)
        return null
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }
  return null
}

/** The media id for an image on the old site, uploading it (to R2, under media/<folder>/) the
 *  first time. An image shared by two owners stays in the folder of the first. */
function media(src: string | undefined | null, alt: string | undefined, folder: string): Promise<number | null> {
  if (!src) return Promise.resolve(null)
  const original = originalOf(src)
  const cached = mediaCache.get(original)
  if (cached) return cached
  const task = (async () => {
    const existing = await findMediaBySource(original)
    if (existing) return existing
    // the original first; when it's gone, the resized copy we were given
    let file = await download(original)
    let used = original
    // some files were uploaded from a Mac: their names are stored decomposed ("i" + accent)
    if (!file && /[^\x00-\x7f]/.test(original)) {
      file = await download(encodeURI(decodeURI(original).normalize('NFD')))
    }
    if (!file && absolute(src) !== original) {
      file = await download(absolute(src))
      used = absolute(src)
    }
    if (!file) return null
    // filenames are unique across the library: generic ones ("6.png", from a different month's
    // upload each time) get their owner and month in front - haru-sofa-202608-6.png
    const { pathname } = new URL(used)
    let name = decodeURIComponent(path.basename(pathname)).normalize('NFC')
    // no accents in storage keys: "Bìa-GG-form-swatch-vải.png" -> "bia-gg-form-swatch-vai.png"
    if (/[^\x00-\x7f]/.test(name)) name = `${slugify(path.parse(name).name)}${path.parse(name).ext.toLowerCase()}`
    if (/^[\d_-]+\.\w+$/.test(name)) {
      const month = pathname.match(/\/(\d{4})\/(\d{2})\//)
      name = `${folder.split('/').pop()}-${month ? month[1] + month[2] + '-' : ''}${name}`
    }
    try {
      const doc = await payload.create({
        collection: 'media',
        data: { alt: alt ? decode(alt).slice(0, 250) : undefined, sourceUrl: original, prefix: folder },
        file: { data: file.data, mimetype: file.mimetype, name, size: file.data.length },
        depth: 0,
      })
      return doc.id as number
    } catch (err) {
      payload.logger.warn(`  ! upload failed ${name}: ${(err as Error).message}`)
      return null
    }
  })()
  mediaCache.set(original, task)
  return task
}

const mediaList = async (srcs: (string | undefined)[], alt: string | undefined, folder: string) =>
  (await pool(srcs, CONCURRENCY, (s) => media(s, alt, folder))).filter((id): id is number => typeof id === 'number')

// ---------------------------------------------------------------------------------------------
// rich text

/** WordPress HTML -> Lexical, its images re-hosted as uploads and site links made relative. */
async function richText(html: string, alt: string | undefined, folder: string) {
  if (!html?.trim()) return null
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const doc = dom.window.document
  for (const el of Array.from(doc.querySelectorAll('script, style, noscript'))) el.remove()
  for (const img of Array.from(doc.querySelectorAll('img'))) {
    const src = img.getAttribute('data-src') || img.getAttribute('src') || ''
    const id = src && !src.startsWith('data:') ? await media(src, img.getAttribute('alt') || alt, folder) : null
    if (!id) {
      img.remove()
      continue
    }
    img.setAttribute('data-lexical-upload-relation-to', 'media')
    img.setAttribute('data-lexical-upload-id', String(id))
    // an image alone in a <figure>/<p>: lift it out so it isn't wrapped in an empty paragraph
    const parent = img.parentElement
    if (parent && parent !== doc.body && parent.textContent?.trim() === '' && parent.children.length === 1) {
      parent.replaceWith(img)
    }
  }
  for (const a of Array.from(doc.querySelectorAll('a[href]'))) {
    a.setAttribute('href', a.getAttribute('href')!.replace(/^https?:\/\/(www\.)?sochiustudio\.com/, '') || '/')
  }
  const state = convertHTMLToLexical({ editorConfig, html: doc.body.innerHTML, JSDOM })
  // upload ids come out of the DOM as strings; Postgres ids are numbers
  const walk = (node: any) => {
    if (node.type === 'upload' && typeof node.value === 'string') node.value = Number(node.value)
    node.children?.forEach(walk)
  }
  walk(state.root)
  return state
}

// ---------------------------------------------------------------------------------------------
// upsert

async function upsert(collection: any, wpId: number, data: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  const { docs } = await payload.find({ collection, where: { wpId: { equals: wpId } }, limit: 1, depth: 0 })
  const base = { ...data, wpId, ...extra }
  const doc = docs[0]
    ? await payload.update({ collection, id: docs[0].id, data: base, locale: 'vi', depth: 0 })
    : await payload.create({ collection, data: base, locale: 'vi', depth: 0 })
  return doc as any
}

const translate = (collection: any, id: number | string, data: Record<string, unknown>) =>
  payload.update({ collection, id, data, locale: 'en', depth: 0 })

// ---------------------------------------------------------------------------------------------
// 1. product categories

// the shop menu's order; English slug per Vietnamese one (the old site's /en/ URLs)
const CATEGORY_EN: Record<string, string> = {
  sofa: 'sofas',
  'ban-tra': 'coffee-tables',
  'ban-an': 'dining-tables',
  'ghe-go': 'wooden-chairs',
  giuong: 'beds',
  'ke-tv': 'tv-cabinets',
}
const categoryIds = new Map<string, number>()

async function importCategories() {
  log('== Product categories')
  const vi: any[] = await get('/wp-json/wc/store/v1/products/categories?per_page=100')
  const en: any[] = await get('/en/wp-json/wc/store/v1/products/categories?per_page=100')
  const order = Object.keys(CATEGORY_EN)
  for (const c of vi) {
    const e = en.find((x) => x.slug === CATEGORY_EN[c.slug])
    const doc = await upsert('product-categories', c.id, {
      title: decode(c.name),
      slug: c.slug,
      order: order.indexOf(c.slug),
    })
    if (e) await translate('product-categories', doc.id, { title: decode(e.name), slug: e.slug })
    categoryIds.set(c.slug, doc.id)
    log(`  ${c.slug} -> ${e?.slug ?? '-'}`)
  }
}

async function loadCategoryIds() {
  if (categoryIds.size) return
  const { docs } = await payload.find({ collection: 'product-categories', limit: 100, depth: 0, locale: 'vi' })
  for (const d of docs) categoryIds.set(d.slug as string, d.id as number)
}

// ---------------------------------------------------------------------------------------------
// 2. fabric library

function pageJson(html: string, re: RegExp): any {
  const m = html.match(re)
  if (!m) throw new Error(`no data matching ${re}`)
  return JSON.parse(m[1])
}

const fabricIdsByName = new Map<string, number>()

async function importFabrics() {
  log('== Fabric library')
  const re = /const materials = (\[.*?\]);/s
  const vi: any[] = pageJson(await get('/thu-vien-vai/', { json: false }), re)
  const en: any[] = pageJson(await get('/en/fabric-library/', { json: false }), re)
  const enByKey = new Map(en.map((m) => [`${m.title}|${m.code}`, m]))
  const block = (m: any, label: string) => htmlToText(m.blocks?.find((b: any) => b.label === label)?.body || '')
  await pool(vi.slice(0, LIMIT), CONCURRENCY, async (m, i) => {
    const swatch = await media(m.popup_image || m.featured_image, m.title, 'fabrics')
    // a square crop for the grid when the page had one ("…-thumb.jpg")
    const thumbnail = m.featured_image && m.featured_image !== m.popup_image ? await media(m.featured_image, m.title, 'fabrics') : null
    const doc = await upsert('fabrics', m.id, {
      name: decode(m.title),
      // two lines can share a colour name (Ash Taupe): the code keeps the URL unique
      slug: slugify(`${decode(m.title)} ${m.code || m.id}`),
      code: m.code || undefined,
      line: decode(m.line || ''),
      intro: htmlToText(m.intro),
      suitableFor: block(m, 'ARTICLE'),
      specs: block(m, 'SPEC'),
      swatch,
      thumbnail,
      order: i,
    })
    const e = enByKey.get(`${m.title}|${m.code}`)
    if (e) {
      // the English page translates the line's name; the rest is still the Vietnamese copy
      const t: Record<string, unknown> = { line: decode(e.line || '') }
      if (htmlToText(e.intro) !== htmlToText(m.intro)) t.intro = htmlToText(e.intro)
      if (block(e, 'ARTICLE') !== block(m, 'ARTICLE')) t.suitableFor = block(e, 'ARTICLE')
      if (block(e, 'SPEC') !== block(m, 'SPEC')) t.specs = block(e, 'SPEC')
      await translate('fabrics', doc.id, t)
    }
    if (!fabricIdsByName.has(m.title.toLowerCase())) fabricIdsByName.set(m.title.toLowerCase(), doc.id)
  })
  log(`  ${Math.min(vi.length, LIMIT)} fabrics`)
}

async function loadFabricIds() {
  if (fabricIdsByName.size) return
  const { docs } = await payload.find({ collection: 'fabrics', limit: 1000, depth: 0, sort: 'order' })
  for (const d of docs) {
    const k = String(d.name).toLowerCase()
    if (!fabricIdsByName.has(k)) fabricIdsByName.set(k, d.id as number)
  }
}

// ---------------------------------------------------------------------------------------------
// 3. products

/** "<li><strong>Chiều dài:</strong> 2500 mm</li>" rows become specs; the rest stays the description. */
function splitSpecs(html: string): { body: string; specs: { label: string; value: string }[] } {
  const dom = new JSDOM(`<!doctype html><body>${html || ''}</body>`)
  const doc = dom.window.document
  const specs: { label: string; value: string }[] = []
  for (const li of Array.from(doc.querySelectorAll('li'))) {
    const strong = li.querySelector('strong, b')
    const label = strong?.textContent?.trim().replace(/:$/, '')
    if (!strong || !label) continue
    const value = (li.textContent || '').replace(strong.textContent || '', '').replace(/^\s*:\s*/, '').trim()
    if (!value) continue
    specs.push({ label, value })
    li.remove()
  }
  for (const ul of Array.from(doc.querySelectorAll('ul, ol'))) if (!ul.querySelector('li')) ul.remove()
  return { body: doc.body.innerHTML, specs }
}

const imgSrcs = (html: string) =>
  Array.from(new JSDOM(`<!doctype html><body>${html || ''}</body>`).window.document.querySelectorAll('img'))
    .map((i) => i.getAttribute('data-src') || i.getAttribute('src') || '')
    .filter((s) => s && !s.startsWith('data:'))

async function importProducts() {
  log('== Products')
  await loadCategoryIds()
  await loadFabricIds()
  const vi: any[] = await get('/wp-json/wc/store/v1/products?per_page=100')
  const en: any[] = await get('/en/wp-json/wc/store/v1/products?per_page=100')
  const enBySlug = new Map(en.map((p) => [p.slug, p]))
  const catOf = new Map<string, string[]>()
  for (const slug of Object.keys(CATEGORY_EN)) {
    const list: any[] = await get(`/wp-json/wc/store/v1/products?per_page=100&category=${slug}`)
    for (const p of list) catOf.set(p.slug, [...(catOf.get(p.slug) || []), slug])
  }

  let n = 0
  // products one at a time (their images go in parallel), so the log reads in order
  for (const p of vi.slice(0, LIMIT)) {
    const name = decode(p.name)
    const e = enBySlug.get(p.slug)
    const folder = `products/${p.slug}`
    const images = await mediaList(p.images.map((i: any) => i.src), name, folder)
    const detailImages = await mediaList(imgSrcs(p.short_description), name, folder)
    const vSplit = splitSpecs(p.description)
    const eSplit = e ? splitSpecs(e.description) : null

    // attributes and the values each variant takes
    const options = (p.attributes || [])
      .filter((a: any) => a.has_variations)
      .map((a: any) => ({
        name: decode(a.name),
        values: a.terms.map((t: any) => ({
          label: decode(t.name),
          value: t.slug,
          fabric: fabricIdsByName.get(decode(t.name).toLowerCase()) ?? null,
        })),
      }))
    const variants = await pool(p.variations || [], CONCURRENCY, async (v: any) => {
      const full = await get(`/wp-json/wc/store/v1/products/${v.id}`)
      const price = Number(full.prices?.regular_price || full.prices?.price) || null
      const sale = Number(full.prices?.sale_price) || null
      return {
        wpId: v.id,
        // an empty value is WooCommerce's "any": the variant fits every choice of that attribute.
        // A few products (Camaleonda, Winston) have variants without attributes at all: their
        // description ("Màu sắc: Sand"), else their id, keeps them apart
        optionValues: v.attributes.length
          ? v.attributes.map((a: any) => a.value || '*').join('|')
          : slugify(decode(full.variation || '')) || `variant-${v.id}`,
        sku: full.sku || undefined,
        price,
        salePrice: sale && price && sale < price ? sale : null,
        inStock: Boolean(full.is_in_stock),
        image: await media(full.images?.[0]?.src, name, folder),
      }
    })
    const prices = variants.map((v) => v.salePrice ?? v.price).filter((x): x is number => !!x)
    const range = p.prices?.price_range

    const doc = await upsert(
      'products',
      p.id,
      {
        title: name,
        slug: p.slug,
        images,
        detailImages,
        description: await richText(vSplit.body, name, folder),
        specs: vSplit.specs,
        options,
        variants,
        priceFrom: Number(range?.min_amount) || (prices.length ? Math.min(...prices) : Number(p.prices?.price) || null),
        priceTo: Number(range?.max_amount) || (prices.length ? Math.max(...prices) : null),
        category: (catOf.get(p.slug) || []).map((s) => categoryIds.get(s)).filter(Boolean),
      },
      { _status: 'published' },
    )

    if (e) {
      // localized fields inside arrays: same rows (ids), English values
      const specs = (doc.specs || []).map((row: any, i: number) => ({
        id: row.id,
        label: eSplit?.specs[i]?.label ?? row.label,
        value: eSplit?.specs[i]?.value ?? row.value,
      }))
      const enAttrs = (e.attributes || []).filter((a: any) => a.has_variations)
      // the old site left the attribute names untranslated on its English pages
      const ATTRIBUTE_EN: Record<string, string> = { 'Màu sắc': 'Colour', 'Màu gỗ': 'Wood colour', 'Phân loại': 'Type' }
      const optionsEn = (doc.options || []).map((row: any, i: number) => {
        const enName = enAttrs[i] ? decode(enAttrs[i].name) : row.name
        return { ...row, name: ATTRIBUTE_EN[enName] ?? enName }
      })
      await translate('products', doc.id, {
        title: decode(e.name),
        description: await richText(eSplit!.body, decode(e.name), folder),
        specs,
        options: optionsEn,
        _status: 'published',
      })
    }
    n++
    log(`  [${n}/${Math.min(vi.length, LIMIT)}] ${name}: ${images.length} images, ${detailImages.length} detail, ${variants.length} variants`)
  }
}

// ---------------------------------------------------------------------------------------------
// 4. posts

// Vietnamese category id -> English one (WPML translations of each other)
const POST_CATEGORY_EN: Record<number, number> = { 88: 112, 87: 113, 74: 109, 89: 111 }

async function importPosts() {
  log('== Posts')
  const catsVi: any[] = await get('/wp-json/wp/v2/categories?per_page=100&lang=vi')
  const catsEn: any[] = await get('/wp-json/wp/v2/categories?per_page=100&lang=en')
  const catIds = new Map<number, number>()
  for (const c of catsVi.filter((c) => POST_CATEGORY_EN[c.id])) {
    const e = catsEn.find((x) => x.id === POST_CATEGORY_EN[c.id])
    const doc = await upsert('post-categories', c.id, { title: decode(c.name), slug: c.slug })
    if (e) await translate('post-categories', doc.id, { title: decode(e.name), slug: e.slug })
    catIds.set(c.id, doc.id)
  }

  const vi: any[] = await get('/wp-json/wp/v2/posts?per_page=100&lang=vi&_embed=1')
  const en: any[] = await get('/wp-json/wp/v2/posts?per_page=100&lang=en&_embed=1')
  // WPML doesn't expose the pairs; both lists come newest first and translate one another
  // one-to-one, so the English post is the one at the same position in the same category
  const enFor = (p: any, i: number) => {
    const e = en[i]
    return e && e.categories.includes(POST_CATEGORY_EN[p.categories[0]]) ? e : null
  }
  for (const [i, p] of vi.slice(0, LIMIT).entries()) {
    const title = decode(p.title.rendered)
    const cover = p._embedded?.['wp:featuredmedia']?.[0]?.source_url
    const folder = `posts/${decodeURIComponent(p.slug)}`
    const doc = await upsert(
      'posts',
      p.id,
      {
        title,
        slug: decodeURIComponent(p.slug),
        cover: await media(cover, title, folder),
        excerpt: htmlToText(p.excerpt.rendered),
        content: await richText(p.content.rendered, title, folder),
        publishedAt: `${p.date_gmt}Z`,
        categories: p.categories.map((c: number) => catIds.get(c)).filter(Boolean),
      },
      { _status: 'published' },
    )
    const e = enFor(p, i)
    if (e) {
      await translate('posts', doc.id, {
        title: decode(e.title.rendered),
        slug: decodeURIComponent(e.slug),
        excerpt: htmlToText(e.excerpt.rendered),
        content: await richText(e.content.rendered, decode(e.title.rendered), folder),
        _status: 'published',
      })
    }
    log(`  ${title}${e ? ` / ${decode(e.title.rendered)}` : ' (no English)'}`)
  }
}

// ---------------------------------------------------------------------------------------------
// 5. customer reviews

async function reviewPages(base: string) {
  const all: any[] = []
  for (let page = 1; page < 50; page++) {
    const html: string = await get(`${base}?srg_page=${page}`, { json: false })
    const items = Array.from(html.matchAll(/<script type="application\/json" class="srg-review-json">(.*?)<\/script>/gs)).map(
      (m) => JSON.parse(m[1]),
    )
    const fresh = items.filter((r) => !all.some((x) => x.date_sort === r.date_sort && x.title === r.title))
    if (!fresh.length) break
    all.push(...fresh)
  }
  return all
}

async function importReviews() {
  log('== Reviews')
  const vi = await reviewPages('/review-tu-khach-hang/')
  const en = await reviewPages('/en/inspiration/')
  const products = await payload.find({ collection: 'products', limit: 500, depth: 0, draft: true })
  const productOf = (wpId: number) => products.docs.find((d) => d.wpId === wpId)?.id ?? null

  let n = 0
  await pool(vi.slice(0, LIMIT), 3, async (r) => {
    // the page's JSON has no id, and neither the title (two "Chị Huyền") nor the timestamp
    // (reviews entered in bulk share one) is unique: the key is a hash of both and the photos
    const key = `${r.date_sort}|${r.title}|${(r.gallery || [])[0] || ''}`
    const wpId = parseInt(crypto.createHash('md5').update(key).digest('hex').slice(0, 8), 16)
    const title = decode(r.title)
    const images = await mediaList(r.gallery || [], title, 'reviews')
    const doc = await upsert('reviews', wpId, {
      title,
      customerName: decode(r.customer || '') || 'Khách hàng',
      location: decode(r.location || ''),
      content: htmlToText(r.content),
      images,
      rating: r.rating || null,
      date: new Date(r.date_sort * 1000).toISOString(),
      product: r.product_id ? productOf(r.product_id) : null,
      productName: decode(r.product_name || '') || undefined,
    })
    const e = en.find((x) => x.date_sort === r.date_sort && x.customer === r.customer)
    if (e) {
      await translate('reviews', doc.id, {
        title: decode(e.title),
        productName: decode(e.product_name || '') || undefined,
        location: decode(e.location || ''),
        content: htmlToText(e.content),
      })
    }
    n++
  })
  log(`  ${n} reviews (${vi.length} on the site)`)
}

// ---------------------------------------------------------------------------------------------
// 6. home page, footer details, blog category tiles

const U = '/wp-content/uploads'

async function importHome() {
  log('== Home page & site settings')
  const slides = [2, 3, 4, 5, 6].map((n, i) => ({
    desktop: `${U}/2026/10/Banner-Web-${n}-1.png`,
    mobile: [
      `${U}/2026/09/1788688518643_1197225542101528419_1197225542101528419_fca77c7e20ff2449d193fb8512624f52.jpg`,
      `${U}/2026/09/1788688518692_1197225542101528419_1197225542101528419_31f460457ec1ecbde6b36ae4dcc8e21e.jpg`,
      `${U}/2026/09/1788688518727_1197225542101528419_1197225542101528419_98a0eaebe69d6b7ce0e54daf5d52f75d.jpg`,
      `${U}/2026/09/1788688518760_1197225542101528419_1197225542101528419_ac1a5034ddff00c4ba2c99c70d3d6d69.jpg`,
      `${U}/2026/09/1788688518794_1197225542101528419_1197225542101528419_9d80f487f1b24db646ffc654e234a8d5.jpg`,
    ][i],
  }))
  const slideRows = await pool(slides, 3, async (s) => ({
    image: await media(s.desktop, 'Sochiu Studio', 'home'),
    mobileImage: await media(s.mobile, 'Sochiu Studio', 'home'),
    alt: 'Sochiu Studio',
  }))

  // blog tiles: the old home page's pictures, by the category they open
  const tiles: Record<string, string> = {
    'cham-soc-ve-sinh-sofa': `${U}/2026/10/2-3.png`,
    'cam-hung-phong-khach': `${U}/2026/10/1.png`,
    'tu-van-chon-noi-that': `${U}/2026/10/3-3.png`,
  }
  const library: number[] = []
  for (const [slug, src] of Object.entries(tiles)) {
    const { docs } = await payload.find({ collection: 'post-categories', where: { slug: { equals: slug } }, locale: 'vi', limit: 1, depth: 0 })
    if (!docs[0]) continue
    await payload.update({ collection: 'post-categories', id: docs[0].id, data: { image: await media(src, docs[0].title as string, 'home') }, depth: 0 })
    library.push(docs[0].id as number)
  }

  const vi = {
    slides: slideRows
      .filter((r): r is typeof r & { image: number } => typeof r.image === 'number')
      .map((r) => ({ ...r, mobileImage: r.mobileImage ?? undefined })),
    productsTitle: 'Sản phẩm',
    catalogueImage: await media(`${U}/2026/07/Banner-Web-2-885-x-698-px.png`, 'SOCHIU Collections', 'home'),
    catalogueEyebrow: 'Catalogue',
    catalogueTitle: 'SOCHIU\nCollections',
    catalogueButtonLabel: 'Xem các bộ sưu tập',
    catalogueButtonUrl: '/bo-suu-tap/',
    libraryTitle: 'Thư viện',
    libraryCategories: library,
    fabricImage: await media(`${U}/2026/07/Bìa-GG-form-swatch-vải-1600-x-400-px-2560-x-1408-px.png`, 'Thư viện vải Sochiu', 'home'),
    fabricTitle: 'Chọn chất liệu cho chiếc sofa của riêng bạn',
    fabricText:
      'Mỗi chất liệu tại Sochiu được chọn để giúp bạn dễ dàng hoàn thiện chiếc sofa phù hợp với không gian, thói quen sử dụng và gu thẩm mỹ riêng.',
    fabricButtonLabel: 'Khám phá thư viện vải',
    fabricButtonUrl: '/thu-vien-vai/',
    inspirationTitle: 'Nguồn cảm hứng',
    inspirationText: 'Khám phá nguồn cảm hứng trang trí nhà cửa từ những không gian nhà đậm chất Sochiu',
    inspirationButtonLabel: 'Xem toàn bộ',
    inspirationButtonUrl: '/review-tu-khach-hang/',
  }
  await payload.updateGlobal({ slug: 'home-page', data: vi, locale: 'vi', depth: 0 })
  const saved: any = await payload.findGlobal({ slug: 'home-page', locale: 'vi', depth: 0 })
  await payload.updateGlobal({
    slug: 'home-page',
    locale: 'en',
    depth: 0,
    data: {
      slides: (saved.slides || []).map((r: any) => ({ ...r, alt: 'Sochiu Studio' })),
      productsTitle: 'Products',
      catalogueEyebrow: 'Catalogue',
      catalogueTitle: 'SOCHIU\nCollections',
      catalogueButtonLabel: 'View Collections',
      libraryTitle: 'Gallery',
      fabricTitle: 'Choose the material for your own sofa',
      fabricText:
        'Every material at Sochiu is selected to help you easily create a sofa that perfectly suits your space, lifestyle, and personal taste.',
      fabricButtonLabel: 'Explore the fabric library',
      inspirationTitle: 'Inspiration',
      inspirationText: 'Discover home decor inspiration from spaces that capture the essence of Sochiu',
      inspirationButtonLabel: 'View All',
    },
  })

  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'vi',
    depth: 0,
    data: {
      hotline: '0878888555',
      socials: {
        facebook: 'https://www.facebook.com/livingsochiu',
        messenger: 'https://m.me/livingsochiu',
        zalo: 'https://zalo.me/0878788555',
        instagram: 'https://www.instagram.com/sochiu_studio/',
        tiktok: 'https://www.tiktok.com/@sochiustudio',
      },
      showrooms: [
        {
          name: 'Showroom Hà Nội',
          address: 'Tầng 8, 31/135 Đội Cấn, Ba Đình, Hanoi, Vietnam, 100000',
          hours: 'Thứ Ba - Chủ Nhật: 10h - 17h\nNghỉ Thứ Hai',
        },
      ],
      // one fact per line: the footer lists them
      businessInfo:
        'Công ty TNHH LIVING SOCHIU\nĐịa chỉ: Tầng 8, 31/135 Đội Cấn, Ba Đình, Hà Nội, Việt Nam\nNgười đại diện: Nguyễn Việt Anh\nMã số đăng ký kinh doanh: 0110776483',
    },
  })
  const settings: any = await payload.findGlobal({ slug: 'site-settings', locale: 'vi', depth: 0 })
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    depth: 0,
    data: {
      showrooms: (settings.showrooms || []).map((r: any) => ({
        ...r,
        name: 'Hanoi Showroom',
        address: '8th Floor, 31/135 Doi Can, Ba Dinh, Hanoi, Vietnam, 100000',
        hours: 'Tuesday - Sunday: 10am - 5pm\nClosed on Monday',
      })),
      businessInfo:
        'LIVING SOCHIU Co., Ltd.\nAddress: 8th Floor, 31/135 Doi Can, Ba Dinh, Hanoi, Vietnam\nRepresentative: Nguyen Viet Anh\nBusiness Registration Number: 0110776483',
    },
  })
  log(`  ${vi.slides.length} slides, ${library.length} blog tiles`)
}

// ---------------------------------------------------------------------------------------------
// 7. the product page's shared tabs (Lưu ý, Vận chuyển, Chính sách): one copy in site settings

async function importProductTabs() {
  log('== Product page tabs')
  const panels = (html: string) => {
    const doc = new JSDOM(html).window.document
    return ['sochiu_essential_info', 'sochiu_shipping_info', 'sochiu_policy_info']
      .map((key) => {
        const panel = doc.querySelector(`.woocommerce-Tabs-panel--${key}`)
        const title = doc.querySelector(`#tab-title-${key} a, li.${key}_tab a`)?.textContent?.trim()
        return panel ? { key, title: title || key, html: panel.innerHTML } : null
      })
      .filter((x): x is { key: string; title: string; html: string } => Boolean(x))
  }
  const vi = panels(await get('/san-pham/elton-sofa-2500/', { json: false }))
  const en = panels(await get('/en/san-pham/elton-sofa-2500/', { json: false }))
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'vi',
    depth: 0,
    data: {
      productInfoTabs: await Promise.all(
        vi.map(async (t) => ({ title: t.title, content: (await richText(t.html, undefined, 'home')) as any })),
      ),
    },
  })
  const saved: any = await payload.findGlobal({ slug: 'site-settings', locale: 'vi', depth: 0 })
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    depth: 0,
    data: {
      productInfoTabs: await Promise.all(
        (saved.productInfoTabs || []).map(async (row: any, i: number) => ({
          ...row,
          title: en[i]?.title ?? row.title,
          content: en[i] ? await richText(en[i].html, undefined, 'home') : row.content,
        })),
      ),
    },
  })
  log(`  ${vi.map((t) => t.title).join(', ')} / ${en.map((t) => t.title).join(', ')}`)
}

// ---------------------------------------------------------------------------------------------
// 8. the shop's material filter (Fabric / Leather / Wood), as the old shop sorted them

async function importMaterials() {
  log('== Shop filter materials')
  const bySlug = new Map<string, Set<string>>()
  for (const material of ['fabric', 'leather', 'wood']) {
    for (let page = 1; page < 10; page++) {
      const html: string = await get(page > 1 ? `/cua-hang/page/${page}/?sc_filter=${material}` : `/cua-hang/?sc_filter=${material}`, {
        json: false,
      }).catch(() => '')
      const body = html.slice(html.indexOf('<div id="content"'), html.indexOf('data-elementor-type="footer"'))
      const slugs = [...new Set(Array.from(body.matchAll(/\/san-pham\/([^/"]+)\//g), (m) => m[1]))]
      const fresh = slugs.filter((s) => !bySlug.get(s)?.has(material))
      if (!fresh.length) break
      for (const s of fresh) bySlug.set(s, new Set([...(bySlug.get(s) || []), material]))
    }
  }
  const { docs } = await payload.find({ collection: 'products', limit: 1000, depth: 0, select: { slug: true } })
  let n = 0
  for (const d of docs) {
    const materials = [...(bySlug.get(d.slug as string) || [])] as ('fabric' | 'leather' | 'wood')[]
    await payload.update({ collection: 'products', id: d.id, data: { materials }, depth: 0 })
    if (materials.length) n++
  }
  log(`  ${n} products tagged`)
}

// ---------------------------------------------------------------------------------------------
// 9. collections (Elton, Fuji Dining Set, Maison, Mellow) and the content pages

const contentOf = (html: string) => {
  const i = html.indexOf('<div id="content"')
  const j = html.indexOf('data-elementor-type="footer"')
  return new JSDOM(`<!doctype html><body>${html.slice(i, j > i ? j : undefined)}</body>`).window.document
}
// htmlToText turns <br> into a new line itself (and the HTML's own line breaks into spaces)
const textWithBreaks = (el: Element | null | undefined) => (el ? htmlToText(el.innerHTML).replace(/\n{2,}/g, '\n') : '')
const imgOf = (el: Element | null | undefined) =>
  Array.from(el?.querySelectorAll('img') || [])
    .map((i) => i.getAttribute('data-src') || i.getAttribute('src') || '')
    .find((s) => s.includes('/wp-content/uploads/'))

async function upsertPage(viSlug: string, enSlug: string, vi: Record<string, any>, en: Record<string, any>) {
  const { docs } = await payload.find({ collection: 'pages', where: { slug: { equals: viSlug } }, locale: 'vi', limit: 1, depth: 0, draft: true })
  const doc: any = docs[0]
    ? await payload.update({ collection: 'pages', id: docs[0].id, data: { ...vi, slug: viSlug, _status: 'published' }, locale: 'vi', depth: 0 })
    : await payload.create({ collection: 'pages', data: { ...vi, slug: viSlug, _status: 'published' } as any, locale: 'vi', depth: 0 })
  // arrays keep their rows: English values onto the Vietnamese rows' ids
  const withIds = (rows: any[] | undefined, enRows: any[] | undefined) =>
    rows?.map((row: any, i: number) => ({ ...row, ...(enRows?.[i] || {}), id: row.id }))
  await payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'en',
    depth: 0,
    data: {
      ...en,
      slug: enSlug,
      sections: en.sections ? withIds(doc.sections, en.sections) : undefined,
      faqs: en.faqs ? withIds(doc.faqs, en.faqs) : undefined,
      _status: 'published',
    },
  })
  log(`  page ${viSlug} / ${enSlug}`)
}

async function importCollections() {
  log('== Collections')
  const cols: any[] = await get('/wp-json/wp/v2/product_collection?per_page=100')
  const list = contentOf(await get('/bo-suu-tap/', { json: false }))
  const covers = new Map<string, string>()
  for (const a of Array.from(list.querySelectorAll('a[href*="/bo-suu-tap/"]'))) {
    const slug = a.getAttribute('href')!.split('/').filter(Boolean).pop()!
    const src = a.querySelector('[data-back]')?.getAttribute('data-back') || imgOf(a)
    if (src && !covers.has(slug)) covers.set(slug, src)
  }
  const products = await payload.find({ collection: 'products', limit: 1000, depth: 0, select: { slug: true } })
  const idOf = new Map(products.docs.map((d) => [d.slug as string, d.id as number]))
  const story = (doc: Document) => {
    const box = doc.querySelector('.sochiu-collection-editor-content')
    box?.querySelectorAll('img, noscript').forEach((e) => e.remove())
    const heading = box?.querySelector('h1, h2, h3, h4, strong')
    const tagline = heading?.textContent?.trim() || ''
    heading?.remove()
    return { tagline, description: htmlToText(box?.innerHTML || '') }
  }
  for (const [i, c] of cols.entries()) {
    const vi = contentOf(await get(`/bo-suu-tap/${c.slug}/`, { json: false }))
    const en = contentOf(await get(`/en/bo-suu-tap/${c.slug}/`, { json: false }))
    const slugs = [...new Set(Array.from(vi.querySelectorAll('a[href*="/san-pham/"]'), (a) => a.getAttribute('href')!.split('/').filter(Boolean).pop()!))]
    const storyImages = Array.from(vi.querySelectorAll('.sochiu-collection-editor-content img'))
      .map((i) => i.getAttribute('data-src') || i.getAttribute('src') || '')
      .filter((src) => src.includes('/wp-content/uploads/'))
    const doc = await upsert('product-collections', c.id, {
      title: decode(c.name),
      gallery: await mediaList([...new Set(storyImages)], decode(c.name), `collections/${c.slug}`),
      slug: c.slug,
      cover: await media(covers.get(c.slug), decode(c.name), 'collections'),
      ...story(vi),
      products: slugs.map((s) => idOf.get(s)).filter(Boolean),
      order: i,
    })
    await translate('product-collections', doc.id, { title: decode(c.name), ...story(en) })
    log(`  ${c.name}: ${slugs.length} products`)
  }
  await upsertPage(
    'bo-suu-tap',
    'collections',
    { title: 'Bộ sưu tập', hero: await media(`${U}/2026/07/2-23.png`, 'Sochiu collections', 'pages') },
    { title: 'Collections' },
  )
}

async function importPages() {
  log('== Content pages')
  // Về chúng tôi: image & text sections
  const sections = (doc: Document) =>
    Array.from(doc.querySelectorAll('.e-parent'))
      .map((box) => {
        const img = imgOf(box)
        const heading = textWithBreaks(box.querySelector('.elementor-heading-title'))
        const body = Array.from(box.querySelectorAll('.elementor-widget-text-editor'))
          .map((e) => htmlToText(e.innerHTML))
          .join('\n\n')
        const button = box.querySelector('a.elementor-button')
        const imgEl = box.querySelector('img')
        const headEl = box.querySelector('.elementor-heading-title')
        const side =
          imgEl && headEl && imgEl.compareDocumentPosition(headEl) & 4 /* heading follows the image */ ? 'left' : 'right'
        return img || heading
          ? { img, heading, body, buttonLabel: button?.textContent?.trim(), buttonUrl: button?.getAttribute('href'), side }
          : null
      })
      .filter(Boolean) as any[]
  const aboutVi = sections(contentOf(await get('/ve-chung-toi/', { json: false })))
  const aboutEn = sections(contentOf(await get('/en/about-us/', { json: false })))
  await upsertPage(
    've-chung-toi',
    'about-us',
    {
      title: 'Về chúng tôi',
      sections: await Promise.all(
        aboutVi.map(async (s, i) => ({
          image: await media(s.img, s.heading, 'pages'),
          heading: s.heading,
          body: s.body,
          buttonLabel: s.buttonLabel,
          buttonUrl: s.buttonUrl?.replace(/^https?:\/\/sochiustudio\.com/, ''),
          imageSide: s.side,
          background: i === 0 ? 'cream' : 'white',
        })),
      ),
    },
    { title: 'About us', sections: aboutEn.map((s) => ({ heading: s.heading, body: s.body, buttonLabel: s.buttonLabel })) },
  )

  // FAQ: a group per tab, each question once
  const faqs = async (doc: Document) => {
    const names = Array.from(doc.querySelectorAll('.e-n-tab-title-text'), (e) => e.textContent?.trim() || '')
    const panels = Array.from(doc.querySelectorAll('.e-n-tabs-content > .e-con, .e-n-tabs-content > div'))
    const rows: any[] = []
    for (const [i, panel] of panels.entries()) {
      const seen = new Set<string>()
      for (const d of Array.from(panel.querySelectorAll('details'))) {
        const q = d.querySelector('summary')?.textContent?.trim().replace(/\s+/g, ' ') || ''
        if (!q || seen.has(q)) continue
        seen.add(q)
        const answer = d.querySelector('summary')?.nextElementSibling?.innerHTML || ''
        rows.push({ group: names[i] || '', question: q, answer: await richText(answer, undefined, 'pages') })
      }
    }
    return rows
  }
  await upsertPage('faq', 'faq', { title: 'FAQ', faqs: await faqs(contentOf(await get('/faq/', { json: false }))) }, {
    title: 'FAQ',
    faqs: await faqs(contentOf(await get('/en/faq/', { json: false }))),
  })

  // Showroom: the picture and the two notes; the map goes with the showroom's details
  const showroom = async (path: string) => {
    const doc = contentOf(await get(path, { json: false }))
    const notes = Array.from(doc.querySelectorAll('.elementor-widget-text-editor'))
      .map((e) => e.innerHTML)
      .filter((h) => !/Tầng 8|8th Floor|Thứ Ba|Tuesday/i.test(h))
      .join('')
    return { doc, notes, title: doc.querySelector('.elementor-heading-title')?.textContent?.trim() || 'Showroom' }
  }
  const sv = await showroom('/showroom/')
  const se = await showroom('/en/showroom/')
  await upsertPage(
    'showroom',
    'showroom',
    { title: sv.title, hero: await media(imgOf(sv.doc.body), sv.title, 'pages'), content: await richText(sv.notes, undefined, 'pages') },
    { title: se.title, content: await richText(se.notes, undefined, 'pages') },
  )
  // the map loads lazily: its address is in data-src
  const frame = sv.doc.querySelector('iframe[data-src*="google.com/maps"], iframe[src*="google.com/maps"]')
  const embed = frame?.getAttribute('data-src') || frame?.getAttribute('src')
  if (embed) {
    const settings: any = await payload.findGlobal({ slug: 'site-settings', locale: 'vi', depth: 0 })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'vi',
      depth: 0,
      data: {
        showrooms: (settings.showrooms || []).map((r: any, i: number) =>
          i === 0 ? { ...r, mapEmbed: embed.startsWith('//') ? `https:${embed}` : embed, mapUrl: r.mapUrl || 'https://www.google.com/maps/search/?api=1&query=Showroom+Sochiu+Studio+31%2F135+%C4%90%E1%BB%99i+C%E1%BA%A5n' } : r,
        ),
      },
    })
  }

  // Chính sách: the PDF the old page showed
  await upsertPage(
    'chinh-sach-mua-hang-van-chuyen-doi-tra-bao-hanh',
    'purchase-shipping-return-and-warranty-policies',
    { title: 'Chính sách mua hàng, vận chuyển, đổi trả & bảo hành', pdf: await media(`${U}/2026/06/Hướng-dẫn-mua-hàng.pdf`, 'Chính sách', 'pages') },
    { title: 'Purchase, shipping, return & warranty policies' },
  )
}

// ---------------------------------------------------------------------------------------------

const started = Date.now()
if (ONLY.has('categories')) await importCategories()
if (ONLY.has('fabrics')) await importFabrics()
if (ONLY.has('products')) await importProducts()
if (ONLY.has('posts')) await importPosts()
if (ONLY.has('reviews')) await importReviews()
if (ONLY.has('home')) await importHome()
if (ONLY.has('tabs')) await importProductTabs()
if (ONLY.has('materials')) await importMaterials()
if (ONLY.has('collections')) await importCollections()
if (ONLY.has('pages')) await importPages()
const { totalDocs } = await payload.count({ collection: 'media' })
log(`Done in ${Math.round((Date.now() - started) / 1000)}s - ${totalDocs} images in the library`)

// the running site caches its pages: ask it to refresh them (best effort - it may not be up)
const site = process.env.NEXT_PUBLIC_SERVER_URL
if (site && process.env.REVALIDATE_SECRET) {
  await fetch(`${site.replace(/\/$/, '')}/api/revalidate`, {
    method: 'POST',
    headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET },
  })
    .then((r) => log(r.ok ? 'Site pages refreshed' : `Site refresh refused (${r.status})`))
    .catch(() => log('Site not reachable - its pages refresh within 5 minutes'))
}
process.exit(0)
