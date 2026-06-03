import { db } from '@/lib/db'
import { evaluateResponse } from '@/lib/domain/monitors'
import { decideIncident } from '@/lib/domain/incidents'

export interface MonitorLike {
  id: string
  url: string
  method: string
  expectedStatus: number
  timeoutMs: number
}

/**
 * Exécute un check sur un moniteur : requête HTTP chronométrée + évaluation,
 * persistance du résultat, et transition d'incident (ouverture / résolution).
 */
export async function runCheck(monitor: MonitorLike) {
  const start = Date.now()
  let statusCode: number | null = null
  let error: string | null = null
  let latencyMs: number | null = null

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), monitor.timeoutMs)
    const res = await fetch(monitor.url, { method: monitor.method, signal: controller.signal, redirect: 'follow' })
    clearTimeout(timer)
    statusCode = res.status
    latencyMs = Date.now() - start
  } catch (e: unknown) {
    latencyMs = Date.now() - start
    const err = e as { name?: string; message?: string }
    error = err.name === 'AbortError' ? 'timeout' : err.message || 'erreur réseau'
  }

  const verdict = evaluateResponse({
    error,
    statusCode,
    latencyMs,
    expectedStatus: monitor.expectedStatus,
    timeoutMs: monitor.timeoutMs,
  })

  await db.check.create({
    data: {
      monitorId: monitor.id,
      ok: verdict.ok,
      statusCode,
      latencyMs,
      error: verdict.ok ? null : error ?? verdict.reason,
    },
  })

  // Transition d'incident d'après les derniers checks.
  const recent = await db.check.findMany({
    where: { monitorId: monitor.id },
    orderBy: { at: 'desc' },
    take: 3,
  })
  const openIncident = await db.incident.findFirst({ where: { monitorId: monitor.id, resolvedAt: null } })
  const decision = decideIncident({ recent: recent.map((c) => ({ ok: c.ok })), openIncident: !!openIncident })

  if (decision.action === 'open' && !openIncident) {
    await db.incident.create({ data: { monitorId: monitor.id, cause: verdict.reason } })
  } else if (decision.action === 'resolve' && openIncident) {
    await db.incident.update({ where: { id: openIncident.id }, data: { resolvedAt: new Date() } })
  }

  return verdict
}

/** Exécute un check sur tous les moniteurs actifs (worker / cron). */
export async function runAllChecks() {
  const monitors = await db.monitor.findMany({ where: { active: true } })
  let ran = 0
  for (const m of monitors) {
    try {
      await runCheck(m)
      ran++
    } catch {
      // on continue : un moniteur en échec ne doit pas bloquer les autres
    }
  }
  return ran
}
