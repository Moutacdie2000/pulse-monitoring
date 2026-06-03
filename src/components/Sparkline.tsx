export function Sparkline({
  values,
  color = 'var(--brand)',
  height = 36,
  width = 120,
}: {
  values: number[]
  color?: string
  height?: number
  width?: number
}) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />
  }
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pad = 2
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - lo) / span) * (height - pad * 2) - pad
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const id = `g${values.length}-${Math.round(hi)}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
