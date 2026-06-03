// Logique métier PURE d'évaluation d'une réponse de sonde.
// Aucune dépendance Prisma/Next : entrées simples, sortie déterministe.

/** Entrée brute issue d'un contrôle HTTP, comparée aux attentes du moniteur. */
export interface EvaluateResponseInput {
  /** Message d'erreur réseau/transport, le cas échéant. */
  error?: string | null;
  /** Code HTTP retourné (absent si la requête n'a pas abouti). */
  statusCode?: number | null;
  /** Latence mesurée en millisecondes. */
  latencyMs?: number | null;
  /** Code HTTP attendu pour considérer la réponse comme valide. */
  expectedStatus: number;
  /** Délai maximal toléré, en millisecondes. */
  timeoutMs: number;
}

/** Résultat d'évaluation : succès et motif explicite (toujours renseigné). */
export interface EvaluateResponseResult {
  ok: boolean;
  reason: string;
}

/**
 * Évalue une réponse de sonde.
 * La réponse est « ok » si : aucune erreur réseau, le code HTTP correspond à
 * l'attendu, et la latence ne dépasse pas le timeout.
 * Les vérifications sont ordonnées de la plus bloquante à la plus fine afin de
 * produire un motif d'échec pertinent.
 */
export function evaluateResponse(
  input: EvaluateResponseInput,
): EvaluateResponseResult {
  const { error, statusCode, latencyMs, expectedStatus, timeoutMs } = input;

  // 1) Erreur réseau / transport : échec immédiat.
  if (error != null && error !== "") {
    return { ok: false, reason: `erreur réseau : ${error}` };
  }

  // 2) Latence : un dépassement du timeout est traité comme un timeout, même
  //    si un code de statut a été reçu (réponse trop tardive).
  if (latencyMs != null && latencyMs > timeoutMs) {
    return {
      ok: false,
      reason: `timeout (${latencyMs} ms > ${timeoutMs} ms)`,
    };
  }

  // 3) Absence de code de statut alors qu'aucune erreur n'a été remontée :
  //    requête non aboutie.
  if (statusCode == null) {
    return { ok: false, reason: "aucun code de statut reçu" };
  }

  // 4) Code de statut différent de l'attendu.
  if (statusCode !== expectedStatus) {
    return {
      ok: false,
      reason: `statut ${statusCode} attendu ${expectedStatus}`,
    };
  }

  return { ok: true, reason: "ok" };
}
