import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, canAddMonitor, minInterval } from "./plan";

describe("PLAN_LIMITS", () => {
  it("expose les limites attendues", () => {
    expect(PLAN_LIMITS.free).toEqual({ monitors: 5, minIntervalSec: 60 });
    expect(PLAN_LIMITS.pro).toEqual({ monitors: 50, minIntervalSec: 30 });
  });
});

describe("canAddMonitor", () => {
  it("autorise tant que la limite n'est pas atteinte (free)", () => {
    expect(canAddMonitor("free", 0)).toBe(true);
    expect(canAddMonitor("free", 4)).toBe(true);
  });

  it("refuse à la limite et au-delà (free)", () => {
    expect(canAddMonitor("free", 5)).toBe(false);
    expect(canAddMonitor("free", 6)).toBe(false);
  });

  it("applique la limite supérieure du plan pro", () => {
    expect(canAddMonitor("pro", 49)).toBe(true);
    expect(canAddMonitor("pro", 50)).toBe(false);
  });

  it("traite un plan inconnu comme free", () => {
    expect(canAddMonitor("entreprise", 4)).toBe(true);
    expect(canAddMonitor("entreprise", 5)).toBe(false);
  });
});

describe("minInterval", () => {
  it("retourne l'intervalle minimal du plan", () => {
    expect(minInterval("free")).toBe(60);
    expect(minInterval("pro")).toBe(30);
  });

  it("traite un plan inconnu comme free", () => {
    expect(minInterval("???")).toBe(60);
  });
});
