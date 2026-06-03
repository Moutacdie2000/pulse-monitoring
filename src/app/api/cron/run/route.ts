import { NextResponse } from 'next/server'
import { runAllChecks } from '@/lib/checks'

export const dynamic = 'force-dynamic'

/**
 * Exécute un check sur tous les moniteurs actifs. Protégé par CRON_SECRET.
 * À appeler depuis un cron externe (Vercel Cron en GET, ou le worker en POST).
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET
  const header = req.headers.get('authorization')
  if (secret && header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const ran = await runAllChecks()
  return NextResponse.json({ ok: true, ran, at: new Date().toISOString() })
}

export const POST = handle
export const GET = handle
