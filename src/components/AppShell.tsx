import Link from 'next/link'
import { signOutAction } from '@/app/actions'
import { StatusPill } from './StatusPill'

interface OrgRef {
  slug: string
  name: string
}

interface Props {
  org: OrgRef
  orgs: OrgRef[]
  user: { name?: string | null; email?: string | null }
  role: string
  orgStatus?: string
  active: 'overview' | 'team' | 'settings'
  children: React.ReactNode
}

export function AppShell({ org, orgs, user, role, orgStatus, active, children }: Props) {
  const base = `/app/${org.slug}`
  const nav = [
    { key: 'overview', label: 'Moniteurs', href: base },
    { key: 'team', label: 'Équipe', href: `${base}/team` },
    { key: 'settings', label: 'Réglages & facturation', href: `${base}/settings` },
  ]
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '256px 1fr' }}>
      <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Link href="/app" style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: '1.15rem' }}>
          <span aria-hidden style={{ display: 'inline-grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', color: '#fff' }}>◠</span>
          Pulse
        </Link>

        <div>
          <div className="kicker" style={{ marginBottom: 6 }}>Organisation</div>
          <details style={{ position: 'relative' }}>
            <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600 }}>
              {org.name}
              <span className="faint">▾</span>
            </summary>
            <div className="card" style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10, padding: 6 }}>
              {orgs.map((o) => (
                <Link key={o.slug} href={`/app/${o.slug}`} style={{ display: 'block', padding: '7px 10px', borderRadius: 6, fontWeight: o.slug === org.slug ? 700 : 500 }}>
                  {o.name}
                </Link>
              ))}
            </div>
          </details>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              style={{
                padding: '9px 11px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '0.92rem',
                background: active === n.key ? 'var(--brand-soft)' : 'transparent',
                color: active === n.key ? 'var(--brand-ink)' : 'var(--ink-2)',
              }}
            >
              {n.label}
            </Link>
          ))}
          <Link href={`/status/${org.slug}`} target="_blank" style={{ padding: '9px 11px', borderRadius: 8, fontWeight: 600, fontSize: '0.92rem', color: 'var(--ink-2)' }}>
            Page de statut publique ↗
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {orgStatus && (
            <div style={{ marginBottom: 12 }}>
              <StatusPill status={orgStatus} live />
            </div>
          )}
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name ?? user.email}</div>
          <div className="faint" style={{ fontSize: '0.78rem', marginBottom: 10 }}>{role}</div>
          <form action={signOutAction}>
            <button className="btn btn-ghost btn-sm" type="submit">Se déconnecter</button>
          </form>
        </div>
      </aside>

      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  )
}
