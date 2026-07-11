import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { quotationSchema } from "@/lib/validations/quotation";
import { buildQuotationComputation, QUOTATION_INCLUDE } from "@/lib/quotation-service";
import { canAccessQuotation, canMutateQuotation, PermissionError } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: QUOTATION_INCLUDE,
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (!canAccessQuotation(session.user.role, session.user.id, quotation.preparedById)) {
      throw new PermissionError("You can only view quotations you prepared.");
    }

    return NextResponse.json({ quotation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (
      !canMutateQuotation(
        session.user.role,
        session.user.id,
        existing.preparedById,
        existing.status
      )
    ) {
      throw new PermissionError(
        "This quotation can no longer be edited (approved, or not yours)."
      );
    }

    const body = await request.json();
    const input = quotationSchema.parse(body);
    const { totals, itemsData } = buildQuotationComputation(input);

    const quotation = await prisma.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: id } });
      return tx.quotation.update({
        where: { id },
        data: {
          customerId: input.customerId,
          projectName: input.projectName,
          projectLocation: input.projectLocation || null,
          date: new Date(input.date),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          subTotal: totals.subTotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount: totals.discountAmount,
          vatPercent: input.vatPercent,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          finalTotal: totals.finalTotal,
          notes: input.notes || null,
          termsAndConditions: input.termsAndConditions || existing.termsAndConditions,
          items: { create: itemsData },
        },
        include: QUOTATION_INCLUDE,
      });
    });

    return NextResponse.json({ quotation });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (!canAccessQuotation(session.user.role, session.user.id, existing.preparedById)) {
      throw new PermissionError("You can only delete quotations you prepared.");
    }
    if (existing.status !== "DRAFT") {
      throw new PermissionError("Only draft quotations can be deleted.");
    }

    await prisma.quotation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
