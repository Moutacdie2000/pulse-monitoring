'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { createMonitorAction, type ActionState } from '@/app/actions'

function SubmitBtn() {
  const { pending } = useFormStatus()
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? 'Ajout…' : 'Ajouter le moniteur'}
    </button>
  )
}

export function MonitorForm({ orgSlug }: { orgSlug: string }) {
  const action = createMonitorAction.bind(null, orgSlug)
  const [state, formAction] = useFormState<ActionState, FormData>(action, { error: null })
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.error === null && formRef.current) {
      formRef.current.reset()
    }
  }, [state])

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        + Nouveau moniteur
      </button>
    )
  }

  return (
    <form ref={formRef} action={formAction} className="card" style={{ padding: 18, display: 'grid', gap: 12, maxWidth: 560 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="label">Nom</label>
          <input className="input" name="name" placeholder="API de production" required />
        </div>
        <div>
          <label className="label">Méthode</label>
          <select className="select" name="method" defaultValue="GET">
            <option>GET</option>
            <option>HEAD</option>
            <option>POST</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">URL</label>
        <input className="input mono" name="url" type="url" placeholder="https://api.exemple.com/health" required />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="label">Intervalle (s)</label>
          <input className="input mono" name="intervalSec" type="number" defaultValue={60} min={30} max={3600} />
        </div>
        <div>
          <label className="label">Statut attendu</label>
          <input className="input mono" name="expectedStatus" type="number" defaultValue={200} min={100} max={599} />
        </div>
        <div>
          <label className="label">Timeout (ms)</label>
          <input className="input mono" name="timeoutMs" type="number" defaultValue={10000} min={1000} max={30000} />
        </div>
      </div>
      {state.error && <p style={{ color: 'var(--down)', fontSize: '0.88rem', margin: 0 }}>{state.error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <SubmitBtn />
        <button className="btn" type="button" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  )
}
