import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/billing'
import { db } from '@/lib/db'

/**
 * Webhook Stripe : met à niveau l'organisation vers le plan « pro » après un
 * abonnement réussi. Inactif si Stripe n'est pas configuré (mode démo).
 */
export async function POST(req: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return NextResponse.json({ ok: false, reason: 'stripe disabled' }, { status: 200 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'missing signature' }, { status: 400 })

  let event
  try {
    const body = await req.text()
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { client_reference_id?: string | null; customer?: string | null }
    if (session.client_reference_id) {
      await db.organization.update({
        where: { id: session.client_reference_id },
        data: { plan: 'pro', stripeCustomerId: (session.customer as string) ?? undefined },
      })
    }
  }

  return NextResponse.json({ received: true })
}
