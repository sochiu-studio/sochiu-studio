import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'

/**
 * Refresh every page now. For writes made outside the site (the import script), which the
 * admin's save hooks don't see. Allowed with REVALIDATE_SECRET (header) or a signed-in admin.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  let allowed = Boolean(secret) && req.headers.get('x-revalidate-secret') === secret
  if (!allowed) {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })
    allowed = Boolean(user)
  }
  if (!allowed) return NextResponse.json({ ok: false }, { status: 401 })
  revalidatePath('/', 'layout')
  return NextResponse.json({ ok: true, revalidated: new Date().toISOString() })
}
