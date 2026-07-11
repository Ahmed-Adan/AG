import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { allocateQuotationSequence, formatQuotationNumber } from "@/lib/quotation-number";
import { QUOTATION_INCLUDE } from "@/lib/quotation-service";
import { canAccessQuotation, PermissionError } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const source = await prisma.quotation.findUnique({
      where: { id },
      include: { items: { orderBy: { position: "asc" } } },
    });

    if (!source) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (!canAccessQuotation(session.user.role, session.user.id, source.preparedById)) {
      throw new PermissionError("You can only duplicate quotations you prepared.");
    }

    const year = new Date().getFullYear();

    const quotation = await prisma.$transaction(async (tx) => {
      const sequence = await allocateQuotationSequence(tx, year);
      const quotationNumber = formatQuotationNumber(year, sequence);

      return tx.quotation.create({
        data: {
          quotationNumber,
          year,
          sequence,
          customerId: source.customerId,
          projectName: `${source.projectName} (Copy)`,
          projectLocation: source.projectLocation,
          date: new Date(),
          validUntil: source.validUntil,
          status: "DRAFT",
          subTotal: source.subTotal,
          discountType: source.discountType,
          discountValue: source.discountValue,
          discountAmount: source.discountAmount,
          vatPercent: source.vatPercent,
          vatAmount: source.vatAmount,
          grandTotal: source.grandTotal,
          finalTotal: source.finalTotal,
          preparedById: session.user.id,
          notes: source.notes,
          termsAndConditions: source.termsAndConditions,
          items: {
            create: source.items.map((item) => ({
              position: item.position,
              description: item.description,
              category: item.category,
              width: item.width,
              height: item.height,
              quantity: item.quantity,
              area: item.area,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
              amount: item.amount,
            })),
          },
        },
        include: QUOTATION_INCLUDE,
      });
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
