import { describe, it, expect } from "vitest";
import { evaluateResponse } from "./monitors";

describe("evaluateResponse", () => {
  it("retourne ok quand statut attendu et latence sous le timeout", () => {
    const r = evaluateResponse({
      statusCode: 200,
      latencyMs: 120,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(true);
    expect(r.reason).toBe("ok");
  });

  it("échoue sur erreur réseau, peu importe le reste", () => {
    const r = evaluateResponse({
      error: "ECONNREFUSED",
      statusCode: 200,
      latencyMs: 5,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("erreur réseau");
    expect(r.reason).toContain("ECONNREFUSED");
  });

  it("traite une chaîne d'erreur vide comme absence d'erreur", () => {
    const r = evaluateResponse({
      error: "",
      statusCode: 200,
      latencyMs: 10,
      expectedStatus: 200,
      timeoutMs: 1000,
    });
    expect(r.ok).toBe(true);
  });

  it("échoue en timeout quand la latence dépasse le seuil", () => {
    const r = evaluateResponse({
      statusCode: 200,
      latencyMs: 12000,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("timeout");
  });

  it("le timeout prime même si un code de statut correct est reçu", () => {
    const r = evaluateResponse({
      statusCode: 200,
      latencyMs: 30001,
      expectedStatus: 200,
      timeoutMs: 30000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("timeout");
  });

  it("accepte une latence exactement égale au timeout (borne incluse)", () => {
    const r = evaluateResponse({
      statusCode: 200,
      latencyMs: 10000,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(true);
  });

  it("échoue quand le code de statut diffère de l'attendu", () => {
    const r = evaluateResponse({
      statusCode: 500,
      latencyMs: 80,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("statut 500 attendu 200");
  });

  it("échoue quand aucun code de statut n'est reçu sans erreur explicite", () => {
    const r = evaluateResponse({
      statusCode: null,
      latencyMs: 50,
      expectedStatus: 200,
      timeoutMs: 10000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("aucun code de statut");
  });

  it("gère un expectedStatus non-200 (ex. 301)", () => {
    const ok = evaluateResponse({
      statusCode: 301,
      latencyMs: 40,
      expectedStatus: 301,
      timeoutMs: 5000,
    });
    expect(ok.ok).toBe(true);

    const ko = evaluateResponse({
      statusCode: 200,
      latencyMs: 40,
      expectedStatus: 301,
      timeoutMs: 5000,
    });
    expect(ko.ok).toBe(false);
    expect(ko.reason).toBe("statut 200 attendu 301");
  });
});
