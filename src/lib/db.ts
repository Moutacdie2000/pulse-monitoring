// Singleton PrismaClient.
// En développement, le hot-reload de Next recharge les modules : sans ce
// pattern globalThis, on créerait une nouvelle instance (et un nouveau pool de
// connexions) à chaque rechargement. On réutilise donc l'instance attachée à
// l'objet global.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
