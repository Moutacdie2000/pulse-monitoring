import 'dotenv/config'

/**
 * Worker de planification : ping l'endpoint de checks à intervalle régulier.
 * En production, on remplace ce worker par un vrai cron (Vercel Cron, ECS
 * Scheduled Task, GitHub Actions schedule…) qui appelle POST /api/cron/run.
 * Ce script local évite d'importer le code de l'app (résolution d'alias).
 */
const url = `${process.env.APP_URL ?? 'http://localhost:3000'}/api/cron/run`
const secret = process.env.CRON_SECRET ?? ''
const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 60_000)

async function tick() {
  try {
    const res = await fetch(url, { method: 'POST', headers: { authorization: `Bearer ${secret}` } })
    const body = await res.json()
    console.log(new Date().toISOString(), res.status, JSON.stringify(body))
  } catch (e) {
    console.error(new Date().toISOString(), 'worker error:', (e as Error).message)
  }
}

console.log(`[pulse worker] ping ${url} toutes les ${intervalMs} ms`)
void tick()
setInterval(tick, intervalMs)
