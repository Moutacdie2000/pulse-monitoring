import { describe, it, expect } from "vitest";
import { computeUptime, bucketDaily, latencySeries } from "./uptime";

describe("computeUptime", () => {
  it("retourne 0 sur une liste vide", () => {
    expect(computeUptime([])).toBe(0);
  });

  it("retourne 100 quand tout est ok", () => {
    expect(computeUptime([{ ok: true }, { ok: true }, { ok: true }])).toBe(100);
  });

  it("retourne 0 quand tout échoue", () => {
    expect(computeUptime([{ ok: false }, { ok: false }])).toBe(0);
  });

  it("calcule un pourcentage arrondi à 2 décimales", () => {
    // 2 succès sur 3 = 66.666... → 66.67
    expect(computeUptime([{ ok: true }, { ok: true }, { ok: false }])).toBe(
      66.67,
    );
  });

  it("gère un cas à 50%", () => {
    expect(computeUptime([{ ok: true }, { ok: false }])).toBe(50);
  });
});

describe("bucketDaily", () => {
  const now = new Date("2026-06-03T12:00:00.000Z");

  it("retourne un seau par jour, le plus ancien d'abord", () => {
    const buckets = bucketDaily([], 7, now);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].date).toBe("2026-05-28");
    expect(buckets[6].date).toBe("2026-06-03");
  });

  it("marque les jours sans contrôle comme none", () => {
    const buckets = bucketDaily([], 3, now);
    expect(buckets.every((b) => b.status === "none")).toBe(true);
    expect(buckets.every((b) => b.total === 0 && b.okRatio === 0)).toBe(true);
  });

  it("agrège les contrôles d'un même jour et calcule le ratio", () => {
    const checks = [
      { at: new Date("2026-06-03T01:00:00Z"), ok: true },
      { at: new Date("2026-06-03T02:00:00Z"), ok: true },
      { at: new Date("2026-06-03T03:00:00Z"), ok: false },
      { at: new Date("2026-06-03T04:00:00Z"), ok: true },
    ];
    const buckets = bucketDaily(checks, 1, now);
    expect(buckets).toHaveLength(1);
    expect(buckets[0].total).toBe(4);
    expect(buckets[0].okRatio).toBe(0.75);
    // 0.75 < 0.95 → down
    expect(buckets[0].status).toBe("down");
  });

  it("classe un jour quasi parfait en operational et un jour limite en degraded", () => {
    // operational : 100 ok / 100
    const okChecks = Array.from({ length: 100 }, () => ({
      at: new Date("2026-06-03T00:00:00Z"),
      ok: true,
    }));
    expect(bucketDaily(okChecks, 1, now)[0].status).toBe("operational");

    // degraded : 96 ok / 100 = 0.96 (>= 0.95 mais < 0.99)
    const mixed = Array.from({ length: 100 }, (_, i) => ({
      at: new Date("2026-06-03T00:00:00Z"),
      ok: i >= 4,
    }));
    const b = bucketDaily(mixed, 1, now)[0];
    expect(b.okRatio).toBeCloseTo(0.96, 5);
    expect(b.status).toBe("degraded");
  });

  it("retourne une liste vide pour days <= 0", () => {
    expect(bucketDaily([], 0, now)).toEqual([]);
    expect(bucketDaily([], -5, now)).toEqual([]);
  });
});

describe("latencySeries", () => {
  const checks = [
    { at: new Date("2026-06-03T05:00:00Z"), latencyMs: 50 }, // plus récent
    { at: new Date("2026-06-03T04:00:00Z"), latencyMs: 60 },
    { at: new Date("2026-06-03T03:00:00Z"), latencyMs: 70 },
    { at: new Date("2026-06-03T02:00:00Z"), latencyMs: 80 },
  ];

  it("retourne les n dernières latences en ordre chronologique", () => {
    // Les 2 plus récents = 50, 60 ; en ordre chronologique = [60, 50]
    expect(latencySeries(checks, 2)).toEqual([60, 50]);
  });

  it("retourne toute la série si n dépasse la taille", () => {
    expect(latencySeries(checks, 10)).toEqual([80, 70, 60, 50]);
  });

  it("traite les latences nulles comme 0", () => {
    const c = [
      { at: new Date("2026-06-03T02:00:00Z"), latencyMs: null },
      { at: new Date("2026-06-03T01:00:00Z") },
    ];
    expect(latencySeries(c, 2)).toEqual([0, 0]);
  });

  it("retourne une liste vide pour n <= 0", () => {
    expect(latencySeries(checks, 0)).toEqual([]);
  });

  it("est indifférente à l'ordre d'entrée (entrée croissante)", () => {
    // Mêmes points, mais triés du plus ancien au plus récent.
    const asc = [...checks].reverse();
    expect(latencySeries(asc, 2)).toEqual([60, 50]);
    expect(latencySeries(asc, 10)).toEqual([80, 70, 60, 50]);
  });
});
