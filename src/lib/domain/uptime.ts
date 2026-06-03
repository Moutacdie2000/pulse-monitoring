// Calculs d'uptime, d'agrégation journalière et de séries de latence.
// Logique PURE (aucun accès base / réseau).

/** État d'un seau journalier pour les barres de la status-page. */
export type DailyBucketStatus = "operational" | "degraded" | "down" | "none";

export interface DailyBucket {
  /** Date du seau au format ISO court (YYYY-MM-DD), en UTC. */
  date: string;
  /** Nombre de contrôles tombant dans ce jour. */
  total: number;
  /** Ratio de succès sur le jour (0..1), 0 si aucun contrôle. */
  okRatio: number;
  /** État synthétique du jour. */
  status: DailyBucketStatus;
}

/**
 * Pourcentage d'uptime sur un ensemble de contrôles.
 * Retourne une valeur 0..100 arrondie à 2 décimales. Liste vide → 0.
 */
export function computeUptime(checks: { ok: boolean }[]): number {
  if (checks.length === 0) {
    return 0;
  }
  const okCount = checks.reduce((acc, c) => acc + (c.ok ? 1 : 0), 0);
  const pct = (okCount / checks.length) * 100;
  return Math.round(pct * 100) / 100;
}

/** Clé jour (YYYY-MM-DD) en UTC pour une date donnée. */
function dayKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Détermine l'état d'un seau journalier à partir de son ratio de succès.
 * - aucun contrôle      → none
 * - ratio >= 0.99       → operational
 * - ratio >= 0.95       → degraded
 * - sinon               → down
 */
function statusFromRatio(total: number, okRatio: number): DailyBucketStatus {
  if (total === 0) {
    return "none";
  }
  if (okRatio >= 0.99) {
    return "operational";
  }
  if (okRatio >= 0.95) {
    return "degraded";
  }
  return "down";
}

/**
 * Répartit les contrôles en seaux journaliers sur `days` jours, le plus ancien
 * en premier. Chaque seau couvre une journée calendaire UTC ; les jours sans
 * contrôle sont présents (total 0, status « none ») pour des barres régulières.
 * `now` borne la fenêtre (le dernier seau correspond au jour de `now`).
 */
export function bucketDaily(
  checks: { at: Date; ok: boolean }[],
  days: number,
  now: Date,
): DailyBucket[] {
  if (days <= 0) {
    return [];
  }

  // Pré-indexation des contrôles par jour pour un coût linéaire.
  const byDay = new Map<string, { total: number; ok: number }>();
  for (const c of checks) {
    const key = dayKeyUTC(c.at);
    const agg = byDay.get(key) ?? { total: 0, ok: 0 };
    agg.total += 1;
    if (c.ok) agg.ok += 1;
    byDay.set(key, agg);
  }

  // Génération des `days` seaux, du plus ancien au plus récent.
  const buckets: DailyBucket[] = [];
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = days - 1; i >= 0; i--) {
    const dayDate = new Date(base - i * DAY_MS);
    const key = dayKeyUTC(dayDate);
    const agg = byDay.get(key) ?? { total: 0, ok: 0 };
    const okRatio = agg.total === 0 ? 0 : agg.ok / agg.total;
    buckets.push({
      date: key,
      total: agg.total,
      okRatio,
      status: statusFromRatio(agg.total, okRatio),
    });
  }

  return buckets;
}

/**
 * Renvoie les `n` dernières latences (en ms), dans l'ordre chronologique
 * (ancien → récent), prêtes pour un sparkline.
 *
 * La fonction est indifférente à l'ordre d'entrée : elle s'appuie sur le champ
 * `at` pour déterminer la chronologie réelle, puis sélectionne les `n` derniers
 * contrôles. Cela la rend robuste que l'appelant fournisse une liste croissante
 * ou décroissante. Les latences nulles/absentes sont traitées comme 0.
 */
export function latencySeries(
  checks: { at: Date; latencyMs?: number | null }[],
  n: number,
): number[] {
  if (n <= 0) {
    return [];
  }
  // Tri chronologique (ancien → récent) sur une copie, puis on garde la queue.
  const sorted = [...checks].sort((a, b) => a.at.getTime() - b.at.getTime());
  return sorted.slice(-n).map((c) => c.latencyMs ?? 0);
}
