import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/permissions";

const BACKUP_VERSION = 1;

export async function GET() {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "backup.manage");

    const [users, customers, quotations, quotationItems, companySettings, quotationCounters, auditLogs] =
      await Promise.all([
        prisma.user.findMany(),
        prisma.customer.findMany(),
        prisma.quotation.findMany(),
        prisma.quotationItem.findMany(),
        prisma.companySettings.findMany(),
        prisma.quotationCounter.findMany(),
        prisma.auditLog.findMany(),
      ]);

    const envelope = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        users,
        customers,
        quotations,
        quotationItems,
        companySettings,
        quotationCounters,
        auditLogs,
      },
    };

    const body = JSON.stringify(envelope, null, 2);
    const fileName = `alhatimi-backup-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
