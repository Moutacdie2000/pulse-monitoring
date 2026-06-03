import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg, getMemberships } from '@/lib/session'
import { getMonitorDetail } from '@/lib/queries'
import { runMonitorNowAction, deleteMonitorAction } from '@/app/actions'
import { can } from '@/lib/domain/rbac'
import { AppShell } from '@/components/AppShell'
import { StatusPill } from '@/components/StatusPill'
import { Sparkline } from '@/components/Sparkline'
import { UptimeBars } from '@/components/UptimeBars'

export const dynamic = 'force-dynamic'

export default async function MonitorDetail({ params }: { params: { org: string; id: string } }) {
  const { user, org, role } = await requireOrg(params.org)
  const memberships = await getMemberships(user.id)
  const orgs = memberships.map((m) => ({ slug: m.org.slug, name: m.org.name }))
  const data = await getMonitorDetail(org.id, params.id)
  if (!data) notFound()
  const { monitor, status, uptime, latency, buckets, checks, incidents } = data

  return (
    <AppShell org={{ slug: org.slug, name: org.name }} orgs={orgs} user={user} role={role} active="overview">
      <div style={{ padding: '26px 30px', maxWidth: 980 }}>
        <Link href={`/app/${org.slug}`} className="faint" style={{ fontSize: '0.85rem' }}>← Tous les moniteurs</Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, margin: '10px 0 22px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ margin: 0, fontSize: '1.7rem' }}>{monitor.name}</h1>
              <StatusPill status={status} live />
            </div>
            <a href={monitor.url} target="_blank" className="mono faint" style={{ fontSize: '0.85rem' }}>{monitor.method} {monitor.url}</a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <form action={runMonitorNowAction.bind(null, org.slug, monitor.id)}>
              <button className="btn btn-sm" type="submit">Vérifier maintenant</button>
            </form>
            {can(role, 'monitor:delete') && (
              <form action={deleteMonitorAction.bind(null, org.slug, monitor.id)}>
                <button className="btn btn-sm btn-danger" type="submit">Supprimer</button>
              </form>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="kicker">Disponibilité</div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{uptime.toFixed(2)}%</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="kicker">Intervalle</div>
            <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700 }}>{monitor.intervalSec}s</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div className="kicker">Latence (récente)</div>
            <Sparkline values={latency} width={220} height={48} />
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 18 }}>
          <div className="kicker" style={{ marginBottom: 10 }}>90 derniers jours</div>
          <UptimeBars buckets={buckets} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Incidents</h3>
            {incidents.length === 0 ? (
              <p className="muted" style={{ fontSize: '0.9rem' }}>Aucun incident enregistré. 🎉</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incidents.map((inc) => (
                  <li key={inc.id} style={{ borderLeft: `3px solid ${inc.resolvedAt ? 'var(--ok)' : 'var(--down)'}`, paddingLeft: 10 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{inc.cause ?? 'Indisponibilité'}</div>
                    <div className="faint mono" style={{ fontSize: '0.76rem' }}>
                      {new Date(inc.startedAt).toLocaleString('fr-FR')} {inc.resolvedAt ? `→ résolu` : '· en cours'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Derniers checks</h3>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5, fontSize: '0.82rem' }}>
              {checks.slice(0, 12).map((c) => (
                <li key={c.id} className="mono" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ color: c.ok ? 'var(--ok)' : 'var(--down)' }}>{c.ok ? '●' : '○'} {c.statusCode ?? c.error ?? ', '}</span>
                  <span className="faint">{c.latencyMs ?? ', '} ms · {new Date(c.at).toLocaleTimeString('fr-FR')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
