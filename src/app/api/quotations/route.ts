import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { quotationSchema } from "@/lib/validations/quotation";
import { buildQuotationComputation, QUOTATION_INCLUDE } from "@/lib/quotation-service";
import { allocateQuotationSequence, formatQuotationNumber } from "@/lib/quotation-number";
import type { QuotationStatus } from "@/types";

const CREATABLE_STATUSES: QuotationStatus[] = ["DRAFT", "PENDING"];

export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const customerId = params.get("customerId");
    const q = params.get("q")?.trim();
    const from = params.get("from");
    const to = params.get("to");

    const quotations = await prisma.quotation.findMany({
      where: {
        ...(status ? { status: status as QuotationStatus } : {}),
        ...(customerId ? { customerId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { quotationNumber: { contains: q, mode: "insensitive" } },
                { projectName: { contains: q, mode: "insensitive" } },
                { customer: { name: { contains: q, mode: "insensitive" } } },
                { customer: { companyName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
        preparedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const { status: rawStatus, ...rest } = body;
    const input = quotationSchema.parse(rest);

    const status: QuotationStatus = CREATABLE_STATUSES.includes(rawStatus)
      ? rawStatus
      : "DRAFT";

    const { totals, itemsData } = buildQuotationComputation(input);

    let termsAndConditions = input.termsAndConditions || null;
    if (!termsAndConditions) {
      const settings = await prisma.companySettings.findUnique({
        where: { id: "singleton" },
      });
      termsAndConditions = settings?.termsAndConditions ?? null;
    }

    const year = new Date(input.date).getFullYear();

    const quotation = await prisma.$transaction(async (tx) => {
      const sequence = await allocateQuotationSequence(tx, year);
      const quotationNumber = formatQuotationNumber(year, sequence);

      return tx.quotation.create({
        data: {
          quotationNumber,
          year,
          sequence,
          customerId: input.customerId,
          projectName: input.projectName,
          projectLocation: input.projectLocation || null,
          date: new Date(input.date),
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          status,
          subTotal: totals.subTotal,
          discountType: input.discountType,
          discountValue: input.discountValue,
          discountAmount: totals.discountAmount,
          vatPercent: input.vatPercent,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          finalTotal: totals.finalTotal,
          preparedById: session.user.id,
          notes: input.notes || null,
          termsAndConditions,
          items: { create: itemsData },
        },
        include: QUOTATION_INCLUDE,
      });
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
