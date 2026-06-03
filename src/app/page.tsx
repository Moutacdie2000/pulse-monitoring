import Link from 'next/link'

export const dynamic = 'force-dynamic'

const FEATURES = [
  { t: 'Surveillance continue', d: 'Des checks planifiés mesurent disponibilité et latence de vos endpoints, 24/7.' },
  { t: 'Incidents & alertes', d: 'Détection automatique des pannes, ouverture d’incidents et notifications (e-mail, webhook, Slack).' },
  { t: 'Pages de statut publiques', d: 'Publiez une page de statut élégante par organisation, rendue en ISR — rapide et rassurante.' },
  { t: 'Multi-tenant & rôles', d: 'Organisations, équipes et RBAC (owner / admin / member). Facturation par abonnement.' },
]

export default function Landing() {
  return (
    <div>
      <header className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: '1.25rem' }}>
          <span aria-hidden style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: '#fff' }}>◠</span>
          Pulse
        </span>
        <nav style={{ display: 'flex', gap: 10 }}>
          <Link className="btn btn-ghost" href="/status/acme">Démo · page de statut</Link>
          <Link className="btn" href="/login">Connexion</Link>
          <Link className="btn btn-primary" href="/register">Commencer</Link>
        </nav>
      </header>

      <section className="container" style={{ padding: '64px 0 40px', textAlign: 'center' }}>
        <span className="pill s-operational" style={{ marginBottom: 18 }}><span className="dot dot-live" />Tous les systèmes opérationnels</span>
        <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', lineHeight: 1.05, letterSpacing: '-0.02em', margin: '14px auto', maxWidth: 16 + 'ch' }}>
          Le monitoring qui inspire confiance.
        </h1>
        <p className="muted" style={{ fontSize: '1.15rem', maxWidth: '42ch', margin: '0 auto 26px' }}>
          Surveillez vos services, ouvrez des incidents automatiquement et publiez de belles pages de statut. Multi-tenant, prêt pour la production.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link className="btn btn-primary" href="/register" style={{ padding: '0.8em 1.4em', fontSize: '1rem' }}>Créer un compte</Link>
          <Link className="btn" href="/login" style={{ padding: '0.8em 1.4em', fontSize: '1rem' }}>Voir la démo</Link>
        </div>
      </section>

      <section className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingBottom: 64 }}>
        {FEATURES.map((f) => (
          <div key={f.t} className="card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem' }}>{f.t}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.95rem' }}>{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="container" style={{ borderTop: '1px solid var(--border)', padding: '24px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span className="faint" style={{ fontSize: '0.85rem' }}>Pulse · démo de portfolio</span>
        <a className="faint" style={{ fontSize: '0.85rem' }} href="https://github.com/Moutacdie2000">@Moutacdie2000</a>
      </footer>
    </div>
  )
}
