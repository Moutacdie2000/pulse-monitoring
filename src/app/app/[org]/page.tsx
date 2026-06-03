import Link from 'next/link'
import { requireOrg, getMemberships } from '@/lib/session'
import { getOrgWithMonitors } from '@/lib/queries'
import { AppShell } from '@/components/AppShell'
import { StatusPill } from '@/components/StatusPill'
import { Sparkline } from '@/components/Sparkline'
import { MonitorForm } from '@/components/MonitorForm'

export const dynamic = 'force-dynamic'

export default async function OrgDashboard({ params }: { params: { org: string } }) {
  const { user, org, role } = await requireOrg(params.org)
  const memberships = await getMemberships(user.id)
  const orgs = memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))
  const data = await getOrgWithMonitors(org.slug)
  const monitors = data?.monitors ?? []

  return (
    <AppShell org={{ slug: org.slug, name: org.name }} orgs={orgs} user={user} role={role} orgStatus={data?.orgStatus} active="overview">
      <div style={{ padding: '26px 30px', maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
          <div>
            <div className="kicker">Vue d'ensemble</div>
            <h1 style={{ margin: '4px 0 0', fontSize: '1.7rem' }}>Moniteurs</h1>
          </div>
          <MonitorForm orgSlug={org.slug} />
        </div>

        {monitors.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p className="muted">Aucun moniteur pour l'instant. Ajoutez votre premier endpoint à surveiller.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {monitors.map((m, i) => (
              <Link
                key={m.id}
                href={`/app/${org.slug}/monitors/${m.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.6fr 110px 130px 92px',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 18px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div className="mono faint" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.url}</div>
                </div>
                <StatusPill status={m.status} live />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <Sparkline values={m.latency} width={120} height={32} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontWeight: 700 }}>{m.uptime.toFixed(2)}%</div>
                  <div className="faint" style={{ fontSize: '0.75rem' }}>{m.lastLatency != null ? `${m.lastLatency} ms` : ', '}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
