export type PayloadAdminRole = "super-admin" | "admin" | "volunteer";

function getPayloadAdminRole(user: unknown): PayloadAdminRole | null {
  if (!user || typeof user !== "object") return null;
  const role = (user as { role?: string }).role;
  if (role === "super-admin" || role === "admin" || role === "volunteer") return role;
  return "admin";
}

/** only super-admin (make another admin) */
export function isSuperAdmin(user: unknown): boolean {
  return getPayloadAdminRole(user) === "super-admin";
}

/** Admin or super-admin (all collections) */
export function isAdminOrAbove(user: unknown): boolean {
  const role = getPayloadAdminRole(user);
  return role === "admin" || role === "super-admin";
}

/** Volunteer, admin, super-admin (Media, Questions, Tryouts) */
export function isVolunteerOrAbove(user: unknown): boolean {
  return getPayloadAdminRole(user) !== null;
}
