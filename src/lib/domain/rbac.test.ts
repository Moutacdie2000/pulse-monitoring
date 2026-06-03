import { describe, it, expect } from "vitest";
import { can, type Action } from "./rbac";

const ALL_ACTIONS: Action[] = [
  "monitor:create",
  "monitor:edit",
  "monitor:delete",
  "member:invite",
  "member:remove",
  "org:billing",
];

describe("can — owner", () => {
  it("autorise toutes les actions", () => {
    for (const action of ALL_ACTIONS) {
      expect(can("owner", action)).toBe(true);
    }
  });
});

describe("can — admin", () => {
  it("autorise la gestion opérationnelle (moniteurs, membres, facturation)", () => {
    expect(can("admin", "monitor:create")).toBe(true);
    expect(can("admin", "monitor:edit")).toBe(true);
    expect(can("admin", "monitor:delete")).toBe(true);
    expect(can("admin", "member:invite")).toBe(true);
    expect(can("admin", "member:remove")).toBe(true);
    expect(can("admin", "org:billing")).toBe(true);
  });
});

describe("can — member", () => {
  it("autorise la création et l'édition de moniteurs", () => {
    expect(can("member", "monitor:create")).toBe(true);
    expect(can("member", "monitor:edit")).toBe(true);
  });

  it("refuse la suppression, l'invitation, le retrait et la facturation", () => {
    expect(can("member", "monitor:delete")).toBe(false);
    expect(can("member", "member:invite")).toBe(false);
    expect(can("member", "member:remove")).toBe(false);
    expect(can("member", "org:billing")).toBe(false);
  });
});
