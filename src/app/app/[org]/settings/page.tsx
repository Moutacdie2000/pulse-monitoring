import { requireOrg, getMemberships } from '@/lib/session'
import { db } from '@/lib/db'
import { upgradeAction } from '@/app/actions'
import { PLAN_LIMITS } from '@/lib/domain/plan'
import { stripeEnabled } from '@/lib/billing'
import { can } from '@/lib/domain/rbac'
import { AppShell } from '@/components/AppShell'

export const dynamic = 'force-dynamic'

const MESSAGES: Record<string, { text: string; tone: string }> = {
  demo: { text: 'Stripe n’est pas configuré : facturation en mode démo.', tone: 'var(--degraded)' },
  ok: { text: 'Abonnement activé, merci !', tone: 'var(--ok)' },
  forbidden: { text: 'Votre rôle ne permet pas de gérer la facturation.', tone: 'var(--down)' },
}

export default async function SettingsPage({ params, searchParams }: { params: { org: string }; searchParams: { billing?: string } }) {
  const { user, org, role } = await requireOrg(params.org)
  const memberships = await getMemberships(user.id)
  const orgs = memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))
  const count = await db.monitor.count({ where: { orgId: org.id } })
  const limits = PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
  const msg = searchParams.billing ? MESSAGES[searchParams.billing] : null

  return (
    <AppShell org={{ slug: org.slug, name: org.name }} orgs={orgs} user={user} role={role} active="settings">
      <div style={{ padding: '26px 30px', maxWidth: 720 }}>
        <div className="kicker">Réglages</div>
        <h1 style={{ margin: '4px 0 22px', fontSize: '1.7rem' }}>Facturation & plan</h1>

        {msg && (
          <div className="card" style={{ padding: 12, marginBottom: 16, borderLeft: `3px solid ${msg.tone}` }}>{msg.text}</div>
        )}

        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="kicker">Plan actuel</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'capitalize' }}>{org.plan}</div>
            </div>
            <span className="pill s-operational">{stripeEnabled ? 'Stripe activé' : 'Stripe, mode démo'}</span>
          </div>

          <div style={{ margin: '18px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
              <span className="muted">Moniteurs utilisés</span>
              <span className="mono">{count} / {limits.monitors}</span>
            </div>
            <div style={{ height: 8, background: 'var(--inset)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (count / limits.monitors) * 100)}%`, height: '100%', background: 'var(--brand)' }} />
            </div>
          </div>

          {org.plan !== 'pro' && can(role, 'org:billing') && (
            <form action={upgradeAction.bind(null, org.slug)}>
              <button className="btn btn-primary" type="submit">Passer au plan Pro</button>
            </form>
          )}
          {org.plan === 'pro' && <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>Vous êtes sur le plan Pro, merci !</p>}
        </div>

        <div className="card" style={{ padding: 22, marginTop: 16 }}>
          <div className="kicker">Page de statut publique</div>
          <a className="mono" href={`/status/${org.slug}`} target="_blank" style={{ color: 'var(--brand-ink)' }}>/status/{org.slug} ↗</a>
        </div>
      </div>
    </AppShell>
  )
}
