import { db } from '@/lib/db'
import { deriveMonitorStatus, deriveOrgStatus, type MonitorStatus } from '@/lib/domain/status'
import { computeUptime, bucketDaily, latencySeries } from '@/lib/domain/uptime'

const RECENT = 60

/** Liste des moniteurs d'une organisation, enrichis (statut, uptime, latence). */
export async function getOrgWithMonitors(slug: string) {
  const org = await db.organization.findUnique({
    where: { slug },
    include: { monitors: { orderBy: { createdAt: 'asc' } } },
  })
  if (!org) return null

  const monitors = await Promise.all(
    org.monitors.map(async (m) => {
      const checks = await db.check.findMany({
        where: { monitorId: m.id },
        orderBy: { at: 'desc' },
        take: RECENT,
      })
      const asc = [...checks].reverse()
      const status = deriveMonitorStatus(checks.map((c) => ({ ok: c.ok, latencyMs: c.latencyMs })))
      return {
        ...m,
        status,
        uptime: computeUptime(checks.map((c) => ({ ok: c.ok }))),
        latency: latencySeries(asc.map((c) => ({ at: c.at, latencyMs: c.latencyMs })), 30),
        lastLatency: checks[0]?.latencyMs ?? null,
        lastAt: checks[0]?.at ?? null,
      }
    }),
  )

  const orgStatus = deriveOrgStatus(monitors.map((m) => m.status as MonitorStatus))
  return { org, monitors, orgStatus }
}

/** Détail d'un moniteur : checks récents + incidents. */
export async function getMonitorDetail(orgId: string, monitorId: string) {
  const monitor = await db.monitor.findFirst({ where: { id: monitorId, orgId } })
  if (!monitor) return null
  const checks = await db.check.findMany({ where: { monitorId }, orderBy: { at: 'desc' }, take: 200 })
  const incidents = await db.incident.findMany({ where: { monitorId }, orderBy: { startedAt: 'desc' }, take: 20 })
  const asc = [...checks].reverse()
  return {
    monitor,
    status: deriveMonitorStatus(checks.map((c) => ({ ok: c.ok, latencyMs: c.latencyMs }))),
    uptime: computeUptime(checks.map((c) => ({ ok: c.ok }))),
    latency: latencySeries(asc.map((c) => ({ at: c.at, latencyMs: c.latencyMs })), 60),
    buckets: bucketDaily(asc.map((c) => ({ at: c.at, ok: c.ok })), 90, new Date()),
    checks: checks.slice(0, 40),
    incidents,
  }
}

/** Données d'une page de statut publique (par slug d'organisation). */
export async function getPublicStatus(slug: string) {
  const org = await db.organization.findUnique({
    where: { slug },
    include: { monitors: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
  })
  if (!org) return null

  const now = new Date()
  const services = await Promise.all(
    org.monitors.map(async (m) => {
      const checks = await db.check.findMany({
        where: { monitorId: m.id },
        orderBy: { at: 'desc' },
        take: 3000,
      })
      const asc = [...checks].reverse()
      return {
        id: m.id,
        name: m.name,
        status: deriveMonitorStatus(checks.map((c) => ({ ok: c.ok, latencyMs: c.latencyMs }))),
        uptime90: computeUptime(checks.map((c) => ({ ok: c.ok }))),
        buckets: bucketDaily(asc.map((c) => ({ at: c.at, ok: c.ok })), 90, now),
      }
    }),
  )

  const incidents = await db.incident.findMany({
    where: { monitor: { orgId: org.id } },
    orderBy: { startedAt: 'desc' },
    take: 15,
    include: { monitor: { select: { name: true } } },
  })

  return {
    org: { name: org.name, slug: org.slug },
    overall: deriveOrgStatus(services.map((s) => s.status as MonitorStatus)),
    services,
    incidents,
  }
}
