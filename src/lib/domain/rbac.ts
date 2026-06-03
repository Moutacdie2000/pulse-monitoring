// Contrôle d'accès basé sur les rôles (RBAC). Logique PURE.

export type Role = "owner" | "admin" | "member";

export type Action =
  | "monitor:create"
  | "monitor:delete"
  | "member:invite"
  | "member:remove"
  | "org:billing"
  | "monitor:edit";

/**
 * Matrice des permissions : pour chaque rôle, l'ensemble des actions autorisées.
 *
 * - owner  : toutes les actions (y compris facturation et gestion des membres).
 * - admin  : tout au niveau opérationnel (moniteurs, membres, facturation),
 *            seule la propriété de l'organisation lui échappe, mais le transfert
 *            de propriété n'est pas une action exposée ici, donc en pratique
 *            l'admin a accès à l'ensemble des `Action` listées.
 * - member : lecture + création/édition de moniteurs ; pas de suppression, ni
 *            d'invitation/retrait de membres, ni de facturation.
 */
const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  owner: new Set<Action>([
    "monitor:create",
    "monitor:edit",
    "monitor:delete",
    "member:invite",
    "member:remove",
    "org:billing",
  ]),
  admin: new Set<Action>([
    "monitor:create",
    "monitor:edit",
    "monitor:delete",
    "member:invite",
    "member:remove",
    "org:billing",
  ]),
  member: new Set<Action>(["monitor:create", "monitor:edit"]),
};

/** Indique si un rôle est autorisé à effectuer une action donnée. */
export function can(role: Role, action: Action): boolean {
  const allowed = PERMISSIONS[role];
  return allowed ? allowed.has(action) : false;
}
