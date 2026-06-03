import { redirect } from 'next/navigation'
import { requireUser, getMemberships } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function AppIndex() {
  const user = await requireUser()
  const memberships = await getMemberships(user.id)
  if (memberships.length === 0) {
    // Cas limite : compte sans organisation (ne devrait pas arriver après inscription).
    redirect('/login')
  }
  redirect(`/app/${memberships[0].org.slug}`)
}
