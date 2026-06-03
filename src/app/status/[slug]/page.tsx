import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicStatus } from '@/lib/queries'
import { StatusPill } from '@/components/StatusPill'
import { UptimeBars } from '@/components/UptimeBars'

// Page publique rendue en ISR : rapide, mise en cache, régénérée régulièrement.
export const revalidate = 60
export async function generateStaticParams() {
  return [] as { slug: string }[]
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPublicStatus(params.slug)
  return { title: data ? `Statut · ${data.org.name}` : 'Statut' }
}

const BANNER: Record<string, { text: string; bg: string; fg: string }> = {
  operational: { text: 'Tous les systèmes sont opérationnels', bg: 'var(--ok-soft)', fg: 'var(--brand-ink)' },
  degraded: { text: 'Performances dégradées sur certains services', bg: 'var(--degraded-soft)', fg: '#9a6500' },
  down: { text: 'Incident en cours — services impactés', bg: 'var(--down-soft)', fg: '#b53036' },
  unknown: { text: 'Statut indéterminé', bg: 'var(--inset)', fg: 'var(--ink-2)' },
}

export default async function StatusPage({ params }: { params: { slug: string } }) {
  const data = await getPublicStatus(params.slug)
  if (!data) notFound()
  const banner = BANNER[data.overall] ?? BANNER.unknown

  return (
    <div style={{ minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 26 }}>
          <span aria-hidden style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: '#fff' }}>◠</span>
          <h1 style={{ margin: 0, fontSize: '1.3rem' }}>{data.org.name}</h1>
        </div>

        <div className="fade-up" style={{ background: banner.bg, color: banner.fg, borderRadius: 'var(--radius)', padding: '20px 22px', fontWeight: 700, fontSize: '1.15rem', marginBottom: 26 }}>
          {banner.text}
        </div>

        <div className="card">
          {data.services.map((s, i) => (
            <div key={s.id} style={{ padding: '18px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="mono faint" style={{ fontSize: '0.8rem' }}>{s.uptime90.toFixed(2)}%</span>
                  <StatusPill status={s.status} />
                </span>
              </div>
              <UptimeBars buckets={s.buckets} />
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: '1rem', margin: '30px 0 12px' }}>Historique des incidents</h2>
        <div className="card" style={{ padding: 18 }}>
          {data.incidents.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>Aucun incident sur la période. 🎉</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.incidents.map((inc) => (
                <li key={inc.id} style={{ borderLeft: `3px solid ${inc.resolvedAt ? 'var(--ok)' : 'var(--down)'}`, paddingLeft: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{inc.monitor.name} — {inc.cause ?? 'indisponibilité'}</div>
                  <div className="faint mono" style={{ fontSize: '0.76rem' }}>
                    {new Date(inc.startedAt).toLocaleString('fr-FR')} {inc.resolvedAt ? `→ résolu le ${new Date(inc.resolvedAt).toLocaleString('fr-FR')}` : '· en cours'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="faint" style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: 30 }}>Propulsé par Pulse</p>
      </div>
    </div>
  )
}
