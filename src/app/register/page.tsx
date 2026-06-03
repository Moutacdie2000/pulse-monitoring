import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { AuthForm } from '@/components/AuthForm'

export const dynamic = 'force-dynamic'

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) redirect('/app')
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div className="card fade-up" style={{ width: 'min(420px, 94vw)', padding: 30 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontWeight: 800, fontSize: '1.25rem', marginBottom: 6 }}>
          <span aria-hidden style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: 'var(--brand)', color: '#fff' }}>◠</span>
          Pulse
        </Link>
        <h1 style={{ fontSize: '1.5rem', margin: '8px 0 4px' }}>Créer un compte</h1>
        <p className="muted" style={{ marginTop: 0, fontSize: '0.92rem' }}>Une organisation est créée automatiquement pour vous.</p>
        <AuthForm mode="register" />
      </div>
    </div>
  )
}
