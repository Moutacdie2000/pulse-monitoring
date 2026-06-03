import { describe, it, expect } from "vitest";
import { decideIncident } from "./incidents";

describe("decideIncident", () => {
  it("ouvre un incident après 2 échecs consécutifs (défaut)", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }, { ok: false }, { ok: true }],
        openIncident: false,
      }),
    ).toEqual({ action: "open" });
  });

  it("n'ouvre pas avec un seul échec récent", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }, { ok: true }],
        openIncident: false,
      }),
    ).toEqual({ action: "none" });
  });

  it("n'ouvre pas si pas assez de contrôles pour atteindre le seuil", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }],
        openIncident: false,
      }),
    ).toEqual({ action: "none" });
  });

  it("résout l'incident ouvert au premier succès", () => {
    expect(
      decideIncident({
        recent: [{ ok: true }, { ok: false }, { ok: false }],
        openIncident: true,
      }),
    ).toEqual({ action: "resolve" });
  });

  it("ne résout pas un incident ouvert si le dernier contrôle échoue encore", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }, { ok: false }],
        openIncident: true,
      }),
    ).toEqual({ action: "none" });
  });

  it("respecte un failThreshold personnalisé", () => {
    const recent = [{ ok: false }, { ok: false }, { ok: true }];
    // seuil 3 : seulement 2 échecs consécutifs → pas d'ouverture
    expect(decideIncident({ recent, openIncident: false, failThreshold: 3 })).toEqual(
      { action: "none" },
    );
    // seuil 2 : ouverture
    expect(decideIncident({ recent, openIncident: false, failThreshold: 2 })).toEqual(
      { action: "open" },
    );
  });

  it("ouvre avec un seuil de 3 quand les 3 derniers échouent", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }, { ok: false }, { ok: false }, { ok: true }],
        openIncident: false,
        failThreshold: 3,
      }),
    ).toEqual({ action: "open" });
  });

  it("retombe sur le seuil par défaut si failThreshold <= 0", () => {
    expect(
      decideIncident({
        recent: [{ ok: false }, { ok: false }],
        openIncident: false,
        failThreshold: 0,
      }),
    ).toEqual({ action: "open" });
  });

  it("ne fait rien sur une liste vide sans incident ouvert", () => {
    expect(decideIncident({ recent: [], openIncident: false })).toEqual({
      action: "none",
    });
  });
});
