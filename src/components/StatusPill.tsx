const LABELS: Record<string, string> = {
  operational: 'Opérationnel',
  degraded: 'Dégradé',
  down: 'Hors service',
  unknown: 'Inconnu',
  none: 'Aucune donnée',
}

export function StatusPill({ status, live }: { status: string; live?: boolean }) {
  return (
    <span className={`pill s-${status}`}>
      <span className={`dot ${live && status === 'operational' ? 'dot-live' : ''}`} />
      {LABELS[status] ?? status}
    </span>
  )
}
