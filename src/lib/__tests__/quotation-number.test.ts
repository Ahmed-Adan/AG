import { describe, expect, it } from "vitest";
import { formatQuotationNumber } from "@/lib/quotation-number";

describe("formatQuotationNumber", () => {
  it("pads sequence to 4 digits", () => {
    expect(formatQuotationNumber(2026, 1)).toBe("ALH-2026-0001");
    expect(formatQuotationNumber(2026, 42)).toBe("ALH-2026-0042");
    expect(formatQuotationNumber(2026, 10000)).toBe("ALH-2026-10000");
  });
});
