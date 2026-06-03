// Limites de plan de facturation. Logique PURE.

/** Limites par plan : nombre de moniteurs et intervalle minimal de sonde. */
export const PLAN_LIMITS = {
  free: { monitors: 5, minIntervalSec: 60 },
  pro: { monitors: 50, minIntervalSec: 30 },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

/** Plan utilisé par défaut lorsqu'un plan inconnu est fourni. */
const FALLBACK_PLAN: PlanName = "free";

/** Résout un nom de plan arbitraire vers un plan connu (fallback « free »). */
function resolvePlan(plan: string): PlanName {
  return plan in PLAN_LIMITS ? (plan as PlanName) : FALLBACK_PLAN;
}

/**
 * Indique si l'on peut ajouter un moniteur de plus compte tenu du plan et du
 * nombre courant de moniteurs. Un plan inconnu est traité comme « free ».
 */
export function canAddMonitor(plan: string, current: number): boolean {
  const limit = PLAN_LIMITS[resolvePlan(plan)].monitors;
  return current < limit;
}

/**
 * Intervalle minimal de sonde (en secondes) autorisé pour le plan.
 * Un plan inconnu est traité comme « free ».
 */
export function minInterval(plan: string): number {
  return PLAN_LIMITS[resolvePlan(plan)].minIntervalSec;
}
