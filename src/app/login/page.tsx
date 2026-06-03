import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AuthForm } from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect('/app')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card fade-up" style={{ width: 'min(420px, 94vw)', padding: 30 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>
          <span aria-hidden style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: '#fff' }}>◠</span>
          Pulse
        </Link>
        <h1 style={{ fontSize: '1.5rem', margin: '8px 0 4px' }}>Content de vous revoir</h1>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.92rem' }}>Connectez-vous pour accéder à vos moniteurs.</p>
        <AuthForm mode="login" />
        <div style={{ marginTop: 16, padding: 10, background: 'var(--inset)', borderRadius: 8, fontSize: '0.82rem' }} className="mono muted">
          Démo : jordan@pulse.dev · password123
        </div>
      </div>
    </div>
  )
}
