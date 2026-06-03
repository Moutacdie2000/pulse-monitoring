import { describe, it, expect } from "vitest";
import {
  deriveMonitorStatus,
  deriveOrgStatus,
  type MonitorStatus,
} from "./status";

describe("deriveMonitorStatus", () => {
  it("retourne unknown sur une liste vide", () => {
    expect(deriveMonitorStatus([])).toBe("unknown");
  });

  it("retourne down si le dernier contrôle échoue", () => {
    expect(
      deriveMonitorStatus([{ ok: false }, { ok: true }, { ok: true }]),
    ).toBe("down");
  });

  it("retourne operational si tous les contrôles récents sont ok et rapides", () => {
    expect(
      deriveMonitorStatus([
        { ok: true, latencyMs: 100 },
        { ok: true, latencyMs: 120 },
      ]),
    ).toBe("operational");
  });

  it("retourne degraded en cas d'échecs intermittents (dernier ok)", () => {
    expect(
      deriveMonitorStatus([
        { ok: true },
        { ok: false },
        { ok: true },
      ]),
    ).toBe("degraded");
  });

  it("retourne degraded si la latence du dernier contrôle dépasse le seuil", () => {
    expect(
      deriveMonitorStatus([{ ok: true, latencyMs: 2500 }], {
        degradedLatencyMs: 1000,
      }),
    ).toBe("degraded");
  });

  it("respecte le seuil de latence personnalisé", () => {
    const checks = [{ ok: true, latencyMs: 800 }];
    expect(deriveMonitorStatus(checks, { degradedLatencyMs: 500 })).toBe(
      "degraded",
    );
    expect(deriveMonitorStatus(checks, { degradedLatencyMs: 1000 })).toBe(
      "operational",
    );
  });

  it("ignore une latence nulle pour le calcul du dégradé", () => {
    expect(deriveMonitorStatus([{ ok: true, latencyMs: null }])).toBe(
      "operational",
    );
  });
});

describe("deriveOrgStatus", () => {
  it("retourne unknown si vide", () => {
    expect(deriveOrgStatus([])).toBe("unknown");
  });

  it("retourne unknown si tous les moniteurs sont inconnus", () => {
    expect(deriveOrgStatus(["unknown", "unknown"])).toBe("unknown");
  });

  it("priorise down sur tout le reste", () => {
    const statuses: MonitorStatus[] = [
      "operational",
      "degraded",
      "down",
      "unknown",
    ];
    expect(deriveOrgStatus(statuses)).toBe("down");
  });

  it("retourne degraded si pas de down mais au moins un degraded", () => {
    expect(deriveOrgStatus(["operational", "degraded", "unknown"])).toBe(
      "degraded",
    );
  });

  it("retourne operational si tous opérationnels (en ignorant unknown)", () => {
    expect(deriveOrgStatus(["operational", "unknown", "operational"])).toBe(
      "operational",
    );
  });
});
