import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { can, canAccessQuotation, PermissionError } from "@/lib/permissions";
import { QUOTATION_INCLUDE } from "@/lib/quotation-service";
import type { QuotationStatus } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

const ALLOWED_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  DRAFT: ["PENDING"],
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { status: nextStatus } = bodySchema.parse(await request.json());

    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (!ALLOWED_TRANSITIONS[existing.status as QuotationStatus].includes(nextStatus)) {
      throw new PermissionError(
        `Cannot move a quotation from ${existing.status} to ${nextStatus}.`
      );
    }

    if (nextStatus === "PENDING") {
      if (!canAccessQuotation(session.user.role, session.user.id, existing.preparedById)) {
        throw new PermissionError("You can only submit quotations you prepared.");
      }
    } else {
      // APPROVED / REJECTED require the approval permission (Manager/Admin).
      if (!can(session.user.role, "quotation.approve")) {
        throw new PermissionError("Only managers and admins can approve or reject quotations.");
      }
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextStatus === "APPROVED" || nextStatus === "REJECTED"
          ? { approvedById: session.user.id, approvedAt: new Date() }
          : {}),
      },
      include: QUOTATION_INCLUDE,
    });

    return NextResponse.json({ quotation });
  } catch (error) {
    return handleApiError(error);
  }
}
