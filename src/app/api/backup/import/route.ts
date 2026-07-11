import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission, PermissionError } from "@/lib/permissions";

const record = z.record(z.string(), z.unknown());

const envelopeSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    users: z.array(record),
    customers: z.array(record),
    quotations: z.array(record),
    quotationItems: z.array(record),
    companySettings: z.array(record),
    quotationCounters: z.array(record),
    auditLogs: z.array(record),
  }),
});

function withDates(
  rows: Record<string, unknown>[],
  dateFields: string[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const copy: Record<string, unknown> = { ...row };
    for (const field of dateFields) {
      if (copy[field] !== null && copy[field] !== undefined) {
        copy[field] = new Date(copy[field] as string);
      }
    }
    return copy;
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "backup.manage");

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No backup file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    const envelope = envelopeSchema.parse(parsed);
    if (envelope.version !== 1) {
      throw new PermissionError(`Unsupported backup version: ${envelope.version}`, 400);
    }

    const { data } = envelope;

    await prisma.$transaction(async (tx) => {
      // FK-safe delete order
      await tx.auditLog.deleteMany();
      await tx.quotationItem.deleteMany();
      await tx.quotation.deleteMany();
      await tx.customer.deleteMany();
      await tx.quotationCounter.deleteMany();
      await tx.companySettings.deleteMany();
      await tx.user.deleteMany();

      // Re-insert in FK-safe order
      await tx.user.createMany({
        data: withDates(data.users, ["createdAt", "updatedAt"]) as never,
      });
      await tx.customer.createMany({
        data: withDates(data.customers, ["createdAt", "updatedAt"]) as never,
      });
      await tx.companySettings.createMany({
        data: withDates(data.companySettings, ["updatedAt"]) as never,
      });
      await tx.quotationCounter.createMany({ data: data.quotationCounters as never });
      await tx.quotation.createMany({
        data: withDates(data.quotations, [
          "date",
          "validUntil",
          "approvedAt",
          "createdAt",
          "updatedAt",
        ]) as never,
      });
      await tx.quotationItem.createMany({ data: data.quotationItems as never });
      await tx.auditLog.createMany({
        data: withDates(data.auditLogs, ["createdAt"]) as never,
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
