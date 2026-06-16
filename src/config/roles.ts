export const roles = {
  superAdmin: "SUPER_ADMIN",
  admin: "ADMIN",
  agent: "AGENT",
  customer: "CUSTOMER",
} as const;

export type UserRole = (typeof roles)[keyof typeof roles];

export const adminRoles: UserRole[] = [roles.superAdmin, roles.admin];
export const agentRoles: UserRole[] = [roles.agent];

export function isAdminRole(role?: string | null) {
  return role === roles.superAdmin || role === roles.admin;
}

export function isAgentRole(role?: string | null) {
  return role === roles.agent;
}
