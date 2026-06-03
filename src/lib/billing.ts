import Stripe from 'stripe'

/** La facturation est OPTIONNELLE : sans clé Stripe, l'app tourne en mode démo. */
export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY

let _stripe: Stripe | null = null
export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  return _stripe
}

export function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000'
}
