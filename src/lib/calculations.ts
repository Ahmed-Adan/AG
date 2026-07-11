export type DiscountType = "PERCENT" | "FIXED";

export interface LineItemInput {
  width: number;
  height: number;
  quantity: number;
  unitPrice: number;
  discountType: DiscountType;
  discountValue: number;
}

export interface LineItemComputed {
  area: number;
  amount: number;
}

export interface QuotationTotals {
  subTotal: number;
  discountAmount: number;
  grandTotal: number;
  vatAmount: number;
  finalTotal: number;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function applyDiscount(base: number, type: DiscountType, value: number): number {
  if (!value) return 0;
  if (type === "PERCENT") return base * (value / 100);
  return value;
}

export function computeLineArea(width: number, height: number, quantity: number): number {
  const w = Number.isFinite(width) ? width : 0;
  const h = Number.isFinite(height) ? height : 0;
  const q = Number.isFinite(quantity) ? quantity : 0;
  return round4(w * h * q);
}

export function computeLineAmount(
  area: number,
  unitPrice: number,
  discountType: DiscountType,
  discountValue: number
): number {
  const gross = area * (Number.isFinite(unitPrice) ? unitPrice : 0);
  const discount = applyDiscount(gross, discountType, discountValue || 0);
  return round2(Math.max(gross - discount, 0));
}

export function computeLineItem(item: LineItemInput): LineItemComputed {
  const area = computeLineArea(item.width, item.height, item.quantity);
  const amount = computeLineAmount(area, item.unitPrice, item.discountType, item.discountValue);
  return { area, amount };
}

export function computeQuotationTotals(
  items: LineItemInput[],
  overallDiscountType: DiscountType,
  overallDiscountValue: number,
  vatPercent: number
): QuotationTotals {
  const subTotal = round2(
    items.reduce((sum, item) => {
      const { amount } = computeLineItem(item);
      return sum + amount;
    }, 0)
  );

  const discountAmount = round2(
    Math.min(applyDiscount(subTotal, overallDiscountType, overallDiscountValue || 0), subTotal)
  );

  const grandTotal = round2(subTotal - discountAmount);
  const vatAmount = round2(grandTotal * ((vatPercent || 0) / 100));
  const finalTotal = round2(grandTotal + vatAmount);

  return { subTotal, discountAmount, grandTotal, vatAmount, finalTotal };
}
