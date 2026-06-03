// Schémas de validation zod partagés (formulaires, API routes, server actions).
// Aucune dépendance Prisma : pures contraintes de forme.

import { z } from "zod";

/** Inscription d'un nouvel utilisateur. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Connexion. */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Création / configuration d'un moniteur. */
export const createMonitorSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(60),
  url: z
    .string()
    .trim()
    .url("URL invalide")
    .refine(
      (u) => /^https?:\/\//i.test(u),
      "L'URL doit commencer par http:// ou https://",
    ),
  method: z.enum(["GET", "HEAD", "POST"]),
  intervalSec: z
    .number()
    .int("L'intervalle doit être un entier")
    .min(30)
    .max(3600),
  expectedStatus: z
    .number()
    .int("Le code de statut doit être un entier")
    .min(100)
    .max(599),
  timeoutMs: z
    .number()
    .int("Le timeout doit être un entier")
    .min(1000)
    .max(30000),
});
export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;

/** Création d'une organisation. */
export const createOrgSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(80),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9-]{3,30}$/,
      "Le slug doit contenir 3 à 30 caractères : minuscules, chiffres ou tirets",
    ),
});
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
