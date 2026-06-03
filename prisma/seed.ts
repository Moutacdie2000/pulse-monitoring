// Seed de développement pour « pulse ».
// Exécuté via `tsx prisma/seed.ts`. Idempotent : on purge d'abord les données.
//
// Crée :
//   - 2 utilisateurs (mots de passe « password123 » hachés bcrypt)
//   - 1 organisation « Acme Inc. » (plan pro)
//   - les memberships (jordan = owner, sam = admin)
//   - 5 moniteurs réalistes
//   - ~90 jours d'historique de Check (1 point/heure), majoritairement ok,
//     avec quelques pannes simulées générant des Incident résolus, plus
//     1 incident encore en cours sur un moniteur.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// --- Paramètres de génération -------------------------------------------------

const HISTORY_DAYS = 90;
const POINT_INTERVAL_MS = 60 * 60 * 1000; // 1 point / heure
const DAY_MS = 24 * 60 * 60 * 1000;

/** Une fenêtre de panne simulée, exprimée en décalage (jours avant `now`). */
interface OutageWindow {
  /** Début de la panne, en jours avant maintenant. */
  startDaysAgo: number;
  /** Durée de la panne en heures. */
  durationHours: number;
  /** Cause affichée sur l'incident. */
  cause: string;
}

/** Définition d'un moniteur à semer, avec son scénario de pannes. */
interface MonitorSeed {
  name: string;
  url: string;
  method: "GET" | "HEAD" | "POST";
  intervalSec: number;
  expectedStatus: number;
  timeoutMs: number;
  /** Latence « normale » de base (ms), autour de laquelle on bruite. */
  baseLatencyMs: number;
  /** Pannes historiques (résolues). */
  outages: OutageWindow[];
  /**
   * Si défini, le moniteur subit une panne EN COURS qui a démarré il y a ce
   * nombre d'heures et qui n'est pas résolue (incident ouvert).
   */
  ongoingOutageHoursAgo?: number;
  ongoingCause?: string;
}

// 5 moniteurs réalistes couvrant API, site, checkout, CDN et base de données.
const MONITORS: MonitorSeed[] = [
  {
    name: "API publique",
    url: "https://api.acme.io/health",
    method: "GET",
    intervalSec: 60,
    expectedStatus: 200,
    timeoutMs: 10000,
    baseLatencyMs: 90,
    outages: [
      { startDaysAgo: 67, durationHours: 3, cause: "Déploiement défaillant (rollback)" },
      { startDaysAgo: 21, durationHours: 1, cause: "Pic de latence base de données" },
    ],
  },
  {
    name: "Site vitrine",
    url: "https://www.acme.io",
    method: "GET",
    intervalSec: 120,
    expectedStatus: 200,
    timeoutMs: 8000,
    baseLatencyMs: 160,
    outages: [
      { startDaysAgo: 45, durationHours: 2, cause: "Certificat TLS expiré" },
    ],
  },
  {
    name: "Tunnel de paiement",
    url: "https://checkout.acme.io/status",
    method: "POST",
    intervalSec: 60,
    expectedStatus: 200,
    timeoutMs: 12000,
    baseLatencyMs: 220,
    outages: [
      { startDaysAgo: 53, durationHours: 4, cause: "Indisponibilité du fournisseur de paiement" },
      { startDaysAgo: 12, durationHours: 2, cause: "Timeout passerelle Stripe" },
    ],
  },
  {
    name: "CDN assets",
    url: "https://cdn.acme.io/health.txt",
    method: "HEAD",
    intervalSec: 300,
    expectedStatus: 200,
    timeoutMs: 5000,
    baseLatencyMs: 45,
    outages: [
      { startDaysAgo: 80, durationHours: 1, cause: "Purge de cache régionale" },
    ],
  },
  {
    name: "Base de données (proxy santé)",
    url: "https://db-proxy.acme.io/healthz",
    method: "GET",
    intervalSec: 60,
    expectedStatus: 200,
    timeoutMs: 15000,
    baseLatencyMs: 70,
    outages: [
      { startDaysAgo: 33, durationHours: 2, cause: "Basculement de réplica" },
    ],
    // Incident encore en cours : démarré il y a 5 heures, non résolu.
    ongoingOutageHoursAgo: 5,
    ongoingCause: "Saturation du pool de connexions (en cours)",
  },
];

// --- Utilitaires de génération ------------------------------------------------

/** Latence réaliste : base bruitée + pics occasionnels. */
function sampleLatency(base: number): number {
  // Bruit gaussien grossier via somme de variables uniformes.
  const noise = (Math.random() + Math.random() + Math.random() - 1.5) * 40;
  let latency = base + noise;
  // ~3% de pics de latence (jusqu'à +600 ms).
  if (Math.random() < 0.03) {
    latency += 150 + Math.random() * 450;
  }
  return Math.max(15, Math.round(latency));
}

/** Indique si l'instant `t` tombe dans une fenêtre de panne résolue. */
function isInOutage(t: number, now: number, outages: OutageWindow[]): boolean {
  for (const o of outages) {
    const start = now - o.startDaysAgo * DAY_MS;
    const end = start + o.durationHours * POINT_INTERVAL_MS;
    if (t >= start && t < end) {
      return true;
    }
  }
  return false;
}

/** Codes d'erreur HTTP plausibles pendant une panne. */
const OUTAGE_STATUS = [500, 502, 503, 504];

function pickOutageStatus(): number {
  return OUTAGE_STATUS[Math.floor(Math.random() * OUTAGE_STATUS.length)];
}

// --- Programme principal ------------------------------------------------------

async function main() {
  console.log("Seed pulse : démarrage…");

  // 1) Purge idempotente. L'ordre respecte les contraintes de clés étrangères
  //    (même si onDelete: Cascade couvrirait la plupart des cas).
  await db.check.deleteMany();
  await db.incident.deleteMany();
  await db.monitor.deleteMany();
  await db.membership.deleteMany();
  await db.organization.deleteMany();
  await db.user.deleteMany();
  console.log("  • Données existantes purgées.");

  // 2) Utilisateurs.
  const passwordHash = await bcrypt.hash("password123", 10);

  const jordan = await db.user.create({
    data: {
      email: "jordan@pulse.dev",
      name: "Jordan Smith",
      passwordHash,
    },
  });

  const sam = await db.user.create({
    data: {
      email: "sam@pulse.dev",
      name: "Sam Rivera",
      passwordHash,
    },
  });
  console.log(`  • 2 utilisateurs créés (${jordan.email}, ${sam.email}).`);

  // 3) Organisation.
  const org = await db.organization.create({
    data: {
      name: "Acme Inc.",
      slug: "acme",
      plan: "pro",
    },
  });
  console.log(`  • Organisation « ${org.name} » créée (plan ${org.plan}).`);

  // 4) Memberships.
  await db.membership.createMany({
    data: [
      { userId: jordan.id, orgId: org.id, role: "owner" },
      { userId: sam.id, orgId: org.id, role: "admin" },
    ],
  });
  console.log("  • Memberships créées (jordan=owner, sam=admin).");

  // 5) Moniteurs + historique de checks + incidents.
  const now = Date.now();
  const totalPoints = Math.floor((HISTORY_DAYS * DAY_MS) / POINT_INTERVAL_MS);

  let totalChecks = 0;
  let totalIncidents = 0;
  let totalChecksKo = 0;

  for (const m of MONITORS) {
    const monitor = await db.monitor.create({
      data: {
        orgId: org.id,
        name: m.name,
        url: m.url,
        method: m.method,
        intervalSec: m.intervalSec,
        expectedStatus: m.expectedStatus,
        timeoutMs: m.timeoutMs,
        active: true,
      },
    });

    const ongoingStart =
      m.ongoingOutageHoursAgo != null
        ? now - m.ongoingOutageHoursAgo * POINT_INTERVAL_MS
        : null;

    // Génération des points de contrôle, du plus ancien au plus récent.
    const checkData: {
      monitorId: string;
      at: Date;
      ok: boolean;
      statusCode: number | null;
      latencyMs: number | null;
      error: string | null;
    }[] = [];

    for (let i = totalPoints; i >= 0; i--) {
      const t = now - i * POINT_INTERVAL_MS;

      const inResolvedOutage = isInOutage(t, now, m.outages);
      const inOngoingOutage = ongoingStart != null && t >= ongoingStart;

      if (inResolvedOutage || inOngoingOutage) {
        // Pendant une panne : échec, parfois erreur réseau pure.
        const networkError = Math.random() < 0.3;
        checkData.push({
          monitorId: monitor.id,
          at: new Date(t),
          ok: false,
          statusCode: networkError ? null : pickOutageStatus(),
          latencyMs: networkError ? null : m.timeoutMs + Math.round(Math.random() * 2000),
          error: networkError ? "connect ETIMEDOUT" : null,
        });
        totalChecksKo += 1;
      } else {
        // Fonctionnement normal : ~0.5% de faux-négatifs ponctuels (flap).
        const flap = Math.random() < 0.005;
        if (flap) {
          checkData.push({
            monitorId: monitor.id,
            at: new Date(t),
            ok: false,
            statusCode: 503,
            latencyMs: sampleLatency(m.baseLatencyMs) + 500,
            error: null,
          });
          totalChecksKo += 1;
        } else {
          checkData.push({
            monitorId: monitor.id,
            at: new Date(t),
            ok: true,
            statusCode: m.expectedStatus,
            latencyMs: sampleLatency(m.baseLatencyMs),
            error: null,
          });
        }
      }
    }

    // Insertion en lot des checks.
    await db.check.createMany({ data: checkData });
    totalChecks += checkData.length;

    // Incidents résolus correspondant aux pannes historiques.
    for (const o of m.outages) {
      const start = now - o.startDaysAgo * DAY_MS;
      const end = start + o.durationHours * POINT_INTERVAL_MS;
      await db.incident.create({
        data: {
          monitorId: monitor.id,
          startedAt: new Date(start),
          resolvedAt: new Date(end),
          cause: o.cause,
        },
      });
      totalIncidents += 1;
    }

    // Incident en cours (non résolu) le cas échéant.
    if (ongoingStart != null) {
      await db.incident.create({
        data: {
          monitorId: monitor.id,
          startedAt: new Date(ongoingStart),
          resolvedAt: null,
          cause: m.ongoingCause ?? "Incident en cours",
        },
      });
      totalIncidents += 1;
    }

    console.log(
      `  • Moniteur « ${m.name} » : ${checkData.length} checks, ` +
        `${m.outages.length}${ongoingStart != null ? " (+1 en cours)" : ""} incident(s).`,
    );
  }

  // 6) Résumé.
  console.log("\nRésumé du seed :");
  console.log(`  Utilisateurs       : 2`);
  console.log(`  Organisations      : 1 (${org.slug})`);
  console.log(`  Memberships        : 2`);
  console.log(`  Moniteurs          : ${MONITORS.length}`);
  console.log(`  Checks             : ${totalChecks} (dont ${totalChecksKo} en échec)`);
  console.log(`  Incidents          : ${totalIncidents}`);
  console.log("Seed terminé avec succès.");
}

main()
  .catch((e) => {
    console.error("Échec du seed :", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
