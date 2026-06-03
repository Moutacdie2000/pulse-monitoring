// Décision d'ouverture/résolution d'incident à partir des contrôles récents.
// Logique PURE.

export interface DecideIncidentParams {
  /**
   * Contrôles récents, ordonnés du plus récent au plus ancien
   * (index 0 = dernier contrôle).
   */
  recent: { ok: boolean }[];
  /** Un incident est-il déjà ouvert pour ce moniteur ? */
  openIncident: boolean;
  /** Nombre d'échecs consécutifs requis pour ouvrir un incident (défaut 2). */
  failThreshold?: number;
}

export type IncidentAction = "open" | "resolve" | "none";

export interface DecideIncidentResult {
  action: IncidentAction;
}

const DEFAULT_FAIL_THRESHOLD = 2;

/**
 * Décide de l'action à mener sur les incidents d'un moniteur.
 *
 * - Si un incident est ouvert : on le résout dès que le dernier contrôle est un
 *   succès ; sinon on ne fait rien.
 * - Si aucun incident n'est ouvert : on en ouvre un dès que les `failThreshold`
 *   derniers contrôles sont tous en échec ; sinon on ne fait rien.
 */
export function decideIncident(
  params: DecideIncidentParams,
): DecideIncidentResult {
  const { recent, openIncident } = params;
  const failThreshold = params.failThreshold ?? DEFAULT_FAIL_THRESHOLD;

  // Sécurité : un seuil non positif est ramené au défaut.
  const threshold = failThreshold > 0 ? failThreshold : DEFAULT_FAIL_THRESHOLD;

  const last = recent[0];

  if (openIncident) {
    // Résolution au premier succès observé sur le dernier contrôle.
    if (last && last.ok) {
      return { action: "resolve" };
    }
    return { action: "none" };
  }

  // Pas d'incident ouvert : ouverture après `threshold` échecs consécutifs.
  if (recent.length < threshold) {
    return { action: "none" };
  }

  const consecutiveFail = recent
    .slice(0, threshold)
    .every((c) => !c.ok);

  return { action: consecutiveFail ? "open" : "none" };
}
