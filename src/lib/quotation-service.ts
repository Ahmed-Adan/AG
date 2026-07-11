import { computeLineItem, computeQuotationTotals } from "@/lib/calculations";
import type { QuotationInput } from "@/lib/validations/quotation";

export function buildQuotationComputation(input: QuotationInput) {
  const totals = computeQuotationTotals(
    input.items,
    input.discountType,
    input.discountValue,
    input.vatPercent
  );

  const itemsData = input.items.map((item, index) => {
    const { area, amount } = computeLineItem(item);
    return {
      position: index + 1,
      description: item.description,
      category: item.category || null,
      width: item.width,
      height: item.height,
      quantity: item.quantity,
      area,
      unitPrice: item.unitPrice,
      discountType: item.discountType,
      discountValue: item.discountValue,
      amount,
    };
  });

  return { totals, itemsData };
}

export const QUOTATION_INCLUDE = {
  customer: true,
  preparedBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
  items: { orderBy: { position: "asc" as const } },
};
