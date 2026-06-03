'use client'

import Link from 'next/link'
import { useFormState, useFormStatus } from 'react-dom'
import { loginAction, registerAction, type ActionState } from '@/app/actions'

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: '100%' }}>
      {pending ? '…' : label}
    </button>
  )
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const action = mode === 'login' ? loginAction : registerAction
  const [state, formAction] = useFormState<ActionState, FormData>(action, { error: null })

  return (
    <form action={formAction} style={{ display: 'grid', gap: 14 }}>
      {mode === 'register' && (
        <div>
          <label className="label">Nom</label>
          <input className="input" name="name" placeholder="Jordan" required />
        </div>
      )}
      <div>
        <label className="label">E-mail</label>
        <input className="input mono" name="email" type="email" placeholder="vous@exemple.com" required />
      </div>
      <div>
        <label className="label">Mot de passe</label>
        <input className="input" name="password" type="password" placeholder="••••••••" required minLength={8} />
      </div>
      {state.error && <p style={{ color: 'var(--down)', fontSize: '0.88rem', margin: 0 }}>{state.error}</p>}
      <Submit label={mode === 'login' ? 'Se connecter' : 'Créer mon compte'} />
      <p className="muted" style={{ fontSize: '0.88rem', textAlign: 'center', margin: 0 }}>
        {mode === 'login' ? (
          <>Pas de compte ? <Link href="/register" style={{ color: 'var(--brand-ink)', fontWeight: 600 }}>S'inscrire</Link></>
        ) : (
          <>Déjà un compte ? <Link href="/login" style={{ color: 'var(--brand-ink)', fontWeight: 600 }}>Se connecter</Link></>
        )}
      </p>
    </form>
  )
}
