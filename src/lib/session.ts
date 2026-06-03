import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import type { Role } from '@/lib/domain/rbac'

/** Exige un utilisateur connecté, sinon redirige vers /login. */
export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user as { id: string; email?: string | null; name?: string | null }
}

/** Toutes les organisations de l'utilisateur (avec son rôle). */
export async function getMemberships(userId: string) {
  return db.membership.findMany({
    where: { userId },
    include: { org: true },
    orderBy: { org: { name: 'asc' } },
  })
}

/**
 * Exige que l'utilisateur soit membre de l'organisation `slug`.
 * Renvoie l'utilisateur, l'organisation et son rôle ; redirige sinon.
 */
export async function requireOrg(slug: string) {
  const user = await requireUser()
  const membership = await db.membership.findFirst({
    where: { userId: user.id, org: { slug } },
    include: { org: true },
  })
  if (!membership) redirect('/app')
  return { user, org: membership.org, role: membership.role as Role }
}
