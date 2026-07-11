import { NextRequest, NextResponse } from "next/server";

import { requireSession, handleApiError } from "@/lib/api";
import { generateQuotationPdf } from "@/lib/pdf/generate-quotation-pdf";
import { prisma } from "@/lib/prisma";
import { canAccessQuotation, PermissionError } from "@/lib/permissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { quotationNumber: true, preparedById: true },
    });
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }
    if (!canAccessQuotation(session.user.role, session.user.id, quotation.preparedById)) {
      throw new PermissionError("You can only access quotations you prepared.");
    }

    const buffer = await generateQuotationPdf(id);
    if (!buffer) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quotation.quotationNumber}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
