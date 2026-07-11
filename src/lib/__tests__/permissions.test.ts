import { describe, expect, it } from "vitest";
import { can, canAccessQuotation, canMutateQuotation } from "@/lib/permissions";

describe("can", () => {
  it("gives Admin full access", () => {
    expect(can("ADMIN", "settings.manage")).toBe(true);
    expect(can("ADMIN", "users.manage")).toBe(true);
    expect(can("ADMIN", "backup.manage")).toBe(true);
  });

  it("gives Manager approval and reports but not settings/users", () => {
    expect(can("MANAGER", "quotation.approve")).toBe(true);
    expect(can("MANAGER", "reports.view")).toBe(true);
    expect(can("MANAGER", "settings.manage")).toBe(false);
    expect(can("MANAGER", "users.manage")).toBe(false);
  });

  it("restricts Staff to creating quotations and managing customers", () => {
    expect(can("STAFF", "quotation.create")).toBe(true);
    expect(can("STAFF", "customer.manage")).toBe(true);
    expect(can("STAFF", "quotation.approve")).toBe(false);
    expect(can("STAFF", "quotation.editAny")).toBe(false);
    expect(can("STAFF", "reports.view")).toBe(false);
  });
});

describe("canAccessQuotation", () => {
  it("lets Staff access only their own quotations", () => {
    expect(canAccessQuotation("STAFF", "user-1", "user-1")).toBe(true);
    expect(canAccessQuotation("STAFF", "user-1", "user-2")).toBe(false);
  });

  it("lets Manager access any quotation", () => {
    expect(canAccessQuotation("MANAGER", "user-1", "user-2")).toBe(true);
  });
});

describe("canMutateQuotation", () => {
  it("blocks mutation of Approved quotations even for the owner", () => {
    expect(canMutateQuotation("STAFF", "user-1", "user-1", "APPROVED")).toBe(false);
    expect(canMutateQuotation("ADMIN", "user-1", "user-2", "APPROVED")).toBe(false);
  });

  it("allows Staff to mutate their own Draft/Pending quotations", () => {
    expect(canMutateQuotation("STAFF", "user-1", "user-1", "DRAFT")).toBe(true);
    expect(canMutateQuotation("STAFF", "user-1", "user-1", "PENDING")).toBe(true);
  });
});
