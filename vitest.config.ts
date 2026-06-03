import { defineConfig } from "vitest/config";

// Configuration minimale : les tests de domaine tournent en environnement Node
// (aucune dépendance DOM).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
