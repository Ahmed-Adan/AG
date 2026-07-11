export type Role = "ADMIN" | "MANAGER" | "STAFF";

export type PermissionAction =
  | "quotation.viewAll"
  | "quotation.create"
  | "quotation.editAny"
  | "quotation.deleteAny"
  | "quotation.approve"
  | "customer.manage"
  | "settings.manage"
  | "reports.view"
  | "users.manage"
  | "backup.manage";

const ROLE_PERMISSIONS: Record<Role, PermissionAction[]> = {
  ADMIN: [
    "quotation.viewAll",
    "quotation.create",
    "quotation.editAny",
    "quotation.deleteAny",
    "quotation.approve",
    "customer.manage",
    "settings.manage",
    "reports.view",
    "users.manage",
    "backup.manage",
  ],
  MANAGER: [
    "quotation.viewAll",
    "quotation.create",
    "quotation.editAny",
    "quotation.deleteAny",
    "quotation.approve",
    "customer.manage",
    "reports.view",
  ],
  STAFF: ["quotation.create", "customer.manage"],
};

export function can(role: Role, action: PermissionAction): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export class PermissionError extends Error {
  status: number;
  constructor(
    message = "You do not have permission to perform this action.",
    status = 403
  ) {
    super(message);
    this.name = "PermissionError";
    this.status = status;
  }
}

export function requirePermission(role: Role, action: PermissionAction) {
  if (!can(role, action)) {
    throw new PermissionError();
  }
}

/** Staff may only touch quotations they prepared themselves. */
export function canAccessQuotation(
  role: Role,
  userId: string,
  quotationPreparedById: string
): boolean {
  if (can(role, "quotation.editAny")) return true;
  return quotationPreparedById === userId;
}

/** Staff may only edit/delete their own Draft/Pending quotations. */
export function canMutateQuotation(
  role: Role,
  userId: string,
  quotationPreparedById: string,
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED"
): boolean {
  if (status === "APPROVED") return false;
  return canAccessQuotation(role, userId, quotationPreparedById);
}
