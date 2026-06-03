'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { db } from '@/lib/db'
import { signIn, signOut } from '@/auth'
import { requireOrg } from '@/lib/session'
import { registerSchema, createMonitorSchema } from '@/lib/validations'
import { can } from '@/lib/domain/rbac'
import { canAddMonitor } from '@/lib/domain/plan'
import { runCheck } from '@/lib/checks'
import { getStripe, appUrl } from '@/lib/billing'

export interface ActionState {
  error: string | null
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 22) || 'team'
  )
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/app',
    })
    return { error: null }
  } catch (e) {
    if (e instanceof AuthError) return { error: 'E-mail ou mot de passe invalide.' }
    throw e // laisse passer la redirection Next
  }
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' }

  const exists = await db.user.findUnique({ where: { email: parsed.data.email } })
  if (exists) return { error: 'Un compte existe déjà avec cet e-mail.' }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10)
  let base = slugify(parsed.data.name)
  let slug = base
  let n = 1
  while (await db.organization.findUnique({ where: { slug } })) slug = `${base}-${n++}`

  const user = await db.user.create({
    data: { email: parsed.data.email, name: parsed.data.name, passwordHash },
  })
  const org = await db.organization.create({ data: { name: `Espace de ${parsed.data.name}`, slug } })
  await db.membership.create({ data: { userId: user.id, orgId: org.id, role: 'owner' } })

  await signIn('credentials', { email: parsed.data.email, password: parsed.data.password, redirectTo: '/app' })
  return { error: null }
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' })
}

export async function createMonitorAction(orgSlug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { org, role } = await requireOrg(orgSlug)
  if (!can(role, 'monitor:create')) return { error: "Votre rôle ne permet pas de créer un moniteur." }

  const parsed = createMonitorSchema.safeParse({
    name: formData.get('name'),
    url: formData.get('url'),
    method: formData.get('method') || 'GET',
    intervalSec: Number(formData.get('intervalSec') || 60),
    expectedStatus: Number(formData.get('expectedStatus') || 200),
    timeoutMs: Number(formData.get('timeoutMs') || 10000),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Champs invalides.' }

  const count = await db.monitor.count({ where: { orgId: org.id } })
  if (!canAddMonitor(org.plan, count)) {
    return { error: `Limite du plan « ${org.plan} » atteinte. Passez au plan supérieur.` }
  }

  await db.monitor.create({ data: { orgId: org.id, ...parsed.data } })
  revalidatePath(`/app/${orgSlug}`)
  return { error: null }
}

export async function runMonitorNowAction(orgSlug: string, monitorId: string) {
  const { org } = await requireOrg(orgSlug)
  const monitor = await db.monitor.findFirst({ where: { id: monitorId, orgId: org.id } })
  if (monitor) await runCheck(monitor)
  revalidatePath(`/app/${orgSlug}/monitors/${monitorId}`)
  revalidatePath(`/app/${orgSlug}`)
}

export async function deleteMonitorAction(orgSlug: string, monitorId: string) {
  const { org, role } = await requireOrg(orgSlug)
  if (!can(role, 'monitor:delete')) return
  await db.monitor.deleteMany({ where: { id: monitorId, orgId: org.id } })
  revalidatePath(`/app/${orgSlug}`)
  redirect(`/app/${orgSlug}`)
}

export async function upgradeAction(orgSlug: string) {
  const { org, role } = await requireOrg(orgSlug)
  if (!can(role, 'org:billing')) redirect(`/app/${orgSlug}/settings?billing=forbidden`)

  const stripe = getStripe()
  if (!stripe || !process.env.STRIPE_PRICE_PRO) {
    // Mode démo : Stripe non configuré.
    redirect(`/app/${orgSlug}/settings?billing=demo`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_PRO!, quantity: 1 }],
    client_reference_id: org.id,
    success_url: `${appUrl()}/app/${orgSlug}/settings?billing=ok`,
    cancel_url: `${appUrl()}/app/${orgSlug}/settings`,
  })
  redirect(session.url!)
}
