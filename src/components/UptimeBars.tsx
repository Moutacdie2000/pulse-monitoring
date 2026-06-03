export interface DayBucket {
  date: string
  total: number
  okRatio: number
  status: 'operational' | 'degraded' | 'down' | 'none'
}

const COLOR: Record<DayBucket['status'], string> = {
  operational: '#16a06a',
  degraded: '#c98200',
  down: '#e5484d',
  none: '#e4e7e5',
}

/** Frise de barres journalières façon page de statut (la plus ancienne à gauche). */
export function UptimeBars({ buckets, days = 90 }: { buckets: DayBucket[]; days?: number }) {
  const data = buckets.slice(-days)
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'stretch', height: 34, width: '100%' }}>
      {data.map((b, i) => (
        <div
          key={i}
          title={
            b.status === 'none'
              ? `${b.date} · aucune donnée`
              : `${b.date} · ${(b.okRatio * 100).toFixed(1)} % de disponibilité (${b.total} checks)`
          }
          style={{
            flex: 1,
            minWidth: 2,
            borderRadius: 2,
            background: COLOR[b.status],
            opacity: b.status === 'none' ? 0.5 : 1,
            transition: 'transform 0.1s',
          }}
        />
      ))}
    </div>
  )
}
