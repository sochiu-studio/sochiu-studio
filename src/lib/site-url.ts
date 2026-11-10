/**
 * The site's public address: NEXT_PUBLIC_SERVER_URL when set, else the production domain Vercel
 * gives the project (so a new deployment - or the custom domain later - needs no code change).
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SERVER_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'http://localhost:3100'
).replace(/\/$/, '')
