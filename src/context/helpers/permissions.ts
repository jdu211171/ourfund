import { MemberRole } from '../../types/core';
import { defaultPermissions } from '../../lib/seed';

export function permissionsForRole(role: MemberRole) {
  return {
    ...defaultPermissions,
    "Add or remove members": role === "Admin",
    "Edit budget limits": role !== "Kid",
    "View private wallets": role === "Admin" || role === "Adult",
  };
}
