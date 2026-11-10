import type { Access, FieldAccess } from 'payload'

type Role = 'admin' | 'editor'
const roleOf = (user: unknown): Role | undefined => (user as { role?: Role } | null)?.role

export const anyone: Access = () => true
export const authenticated: Access = ({ req }) => Boolean(req.user)
export const adminOnly: Access = ({ req }) => roleOf(req.user) === 'admin'
export const adminField: FieldAccess = ({ req }) => roleOf(req.user) === 'admin'

/** Published documents for visitors; drafts too for signed-in staff. */
export const publishedOrStaff: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }
