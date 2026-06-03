import { requireOrg, getMemberships } from '@/lib/session'
import { db } from '@/lib/db'
import { AppShell } from '@/components/AppShell'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = { owner: 'Propriétaire', admin: 'Admin', member: 'Membre' }

export default async function TeamPage({ params }: { params: { org: string } }) {
  const { user, org, role } = await requireOrg(params.org)
  const memberships = await getMemberships(user.id)
  const orgs = memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))
  const members = await db.membership.findMany({ where: { orgId: org.id }, include: { user: true }, orderBy: { role: 'asc' } })

  return (
    <AppShell org={{ slug: org.slug, name: org.name }} orgs={orgs} user={user} role={role} active="team">
      <div style={{ padding: '26px 30px', maxWidth: 760 }}>
        <div className="kicker">Organisation · {org.name}</div>
        <h1 style={{ margin: '4px 0 22px', fontSize: '1.7rem' }}>Équipe</h1>

        <div className="card">
          {members.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.user.name ?? m.user.email} {m.userId === user.id && <span className="faint" style={{ fontWeight: 400 }}>· vous</span>}</div>
                <div className="faint mono" style={{ fontSize: '0.8rem' }}>{m.user.email}</div>
              </div>
              <span className="pill s-unknown">{ROLE_LABEL[m.role] ?? m.role}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 14 }}>
          Les invitations par e-mail nécessitent un fournisseur SMTP configuré (mode démo ici). Le contrôle d'accès (RBAC owner / admin / member) est appliqué côté serveur sur chaque action.
        </p>
      </div>
    </AppShell>
  )
}
