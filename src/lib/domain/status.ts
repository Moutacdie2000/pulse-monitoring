// Dérivation de l'état d'un moniteur (et d'une organisation) à partir de ses
// contrôles récents. Logique PURE.

/** État synthétique affiché sur la status-page. */
export type MonitorStatus = "operational" | "degraded" | "down" | "unknown";

/** Un contrôle récent réduit aux champs nécessaires au calcul d'état. */
export interface RecentCheck {
  ok: boolean;
  latencyMs?: number | null;
}

export interface DeriveStatusOptions {
  /** Seuil de latence (ms) au-delà duquel un moniteur sain est « degraded ». */
  degradedLatencyMs?: number;
}

const DEFAULT_DEGRADED_LATENCY_MS = 1000;

/**
 * Dérive l'état d'un moniteur à partir de ses contrôles récents.
 * Convention : `recent` est ordonné du plus récent au plus ancien
 * (index 0 = dernier contrôle).
 *
 * Règles :
 * - vide              → unknown
 * - dernier en échec  → down
 * - sinon, si un échec intermittent existe parmi les contrôles récents, ou si
 *   la latence du dernier contrôle dépasse le seuil → degraded
 * - sinon             → operational
 */
export function deriveMonitorStatus(
  recent: RecentCheck[],
  opts?: DeriveStatusOptions,
): MonitorStatus {
  if (recent.length === 0) {
    return "unknown";
  }

  const degradedLatencyMs =
    opts?.degradedLatencyMs ?? DEFAULT_DEGRADED_LATENCY_MS;

  const last = recent[0];

  // Le dernier contrôle a échoué : le moniteur est considéré « down ».
  if (!last.ok) {
    return "down";
  }

  // Échecs intermittents : le dernier est ok mais des échecs subsistent dans la
  // fenêtre récente → service dégradé.
  const hasRecentFailure = recent.some((c) => !c.ok);
  if (hasRecentFailure) {
    return "degraded";
  }

  // Latence élevée sur le dernier contrôle → dégradé.
  if (last.latencyMs != null && last.latencyMs > degradedLatencyMs) {
    return "degraded";
  }

  return "operational";
}

/**
 * Agrège les états de plusieurs moniteurs en un état global d'organisation.
 * Priorité (du plus grave au plus sain) : down > degraded > operational.
 * Les états « unknown » sont ignorés tant qu'au moins un moniteur est connu ;
 * si tous sont inconnus (ou la liste est vide), on retourne « unknown ».
 */
export function deriveOrgStatus(statuses: MonitorStatus[]): MonitorStatus {
  const known = statuses.filter((s) => s !== "unknown");

  if (known.length === 0) {
    return "unknown";
  }

  if (known.includes("down")) {
    return "down";
  }
  if (known.includes("degraded")) {
    return "degraded";
  }
  return "operational";
}
