import { describe, expect, it } from "vitest";
import {
  computeLineArea,
  computeLineAmount,
  computeLineItem,
  computeQuotationTotals,
} from "@/lib/calculations";

describe("computeLineArea", () => {
  it("multiplies width x height x quantity", () => {
    expect(computeLineArea(1.5, 2, 3)).toBe(9);
  });

  it("handles fractional dimensions with 4dp rounding", () => {
    expect(computeLineArea(1.234, 2.345, 1)).toBeCloseTo(2.894, 3);
  });
});

describe("computeLineAmount", () => {
  it("multiplies area by unit price with no discount", () => {
    expect(computeLineAmount(10, 100, "PERCENT", 0)).toBe(1000);
  });

  it("applies a percent discount", () => {
    expect(computeLineAmount(10, 100, "PERCENT", 10)).toBe(900);
  });

  it("applies a fixed discount", () => {
    expect(computeLineAmount(10, 100, "FIXED", 50)).toBe(950);
  });

  it("never goes negative", () => {
    expect(computeLineAmount(1, 10, "FIXED", 1000)).toBe(0);
  });
});

describe("computeLineItem", () => {
  it("computes area and amount together", () => {
    const { area, amount } = computeLineItem({
      width: 1.5,
      height: 3,
      quantity: 12,
      unitPrice: 220,
      discountType: "PERCENT",
      discountValue: 0,
    });
    expect(area).toBe(54);
    expect(amount).toBe(11880);
  });
});

describe("computeQuotationTotals", () => {
  const items = [
    {
      width: 1.5,
      height: 3.0,
      quantity: 12,
      unitPrice: 220,
      discountType: "PERCENT" as const,
      discountValue: 0,
    },
    {
      width: 1.2,
      height: 1.5,
      quantity: 8,
      unitPrice: 180,
      discountType: "PERCENT" as const,
      discountValue: 5,
    },
    {
      width: 1.0,
      height: 2.4,
      quantity: 4,
      unitPrice: 450,
      discountType: "FIXED" as const,
      discountValue: 50,
    },
  ];

  it("matches the hand-computed seed quotation totals", () => {
    const totals = computeQuotationTotals(items, "PERCENT", 2, 5);

    // Line 1: area 54, amount 11880
    // Line 2: area 14.4, gross 2592, 5% discount => 2462.4
    // Line 3: area 9.6, gross 4320, minus 50 fixed => 4270
    // subTotal = 11880 + 2462.4 + 4270 = 18612.4
    expect(totals.subTotal).toBeCloseTo(18612.4, 2);

    // 2% overall discount
    const expectedDiscount = Math.round(18612.4 * 0.02 * 100) / 100;
    expect(totals.discountAmount).toBeCloseTo(expectedDiscount, 2);

    const expectedGrandTotal = 18612.4 - expectedDiscount;
    expect(totals.grandTotal).toBeCloseTo(expectedGrandTotal, 1);

    const expectedVat = Math.round(expectedGrandTotal * 0.05 * 100) / 100;
    expect(totals.vatAmount).toBeCloseTo(expectedVat, 1);
    expect(totals.finalTotal).toBeCloseTo(expectedGrandTotal + expectedVat, 1);
  });

  it("clamps overall discount so it cannot exceed the subtotal", () => {
    const totals = computeQuotationTotals(
      [{ width: 1, height: 1, quantity: 1, unitPrice: 100, discountType: "PERCENT", discountValue: 0 }],
      "FIXED",
      1000,
      0
    );
    expect(totals.discountAmount).toBe(100);
    expect(totals.grandTotal).toBe(0);
    expect(totals.finalTotal).toBe(0);
  });
});
