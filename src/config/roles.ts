export const CUSTOMER_ROLE = "customer";

export const MANAGEMENT_ROLES = [
  "superadmin",
  "hotel-manager",
  "ferry-manager",
  "park-manager",
  "beach-manager",
] as const;

export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

export function hasAnyManagementRole(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.some((role) => (MANAGEMENT_ROLES as readonly string[]).includes(role));
}

export function isCustomerOnly(roles: string[] | undefined): boolean {
  if (!roles?.length) return false;
  return roles.every((role) => role === CUSTOMER_ROLE);
}
