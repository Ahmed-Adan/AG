import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    await requireSession();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      total,
      approved,
      pending,
      rejected,
      draft,
      approvedAgg,
      monthlyAgg,
      recentQuotations,
      trendRows,
    ] = await Promise.all([
      prisma.quotation.count(),
      prisma.quotation.count({ where: { status: "APPROVED" } }),
      prisma.quotation.count({ where: { status: "PENDING" } }),
      prisma.quotation.count({ where: { status: "REJECTED" } }),
      prisma.quotation.count({ where: { status: "DRAFT" } }),
      prisma.quotation.aggregate({
        where: { status: "APPROVED" },
        _sum: { finalTotal: true },
      }),
      prisma.quotation.aggregate({
        where: { status: "APPROVED", date: { gte: startOfMonth } },
        _sum: { finalTotal: true },
      }),
      prisma.quotation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { customer: true, preparedBy: { select: { id: true, name: true } } },
      }),
      prisma.$queryRaw<{ month: Date; total: string }[]>`
        SELECT date_trunc('month', date) AS month, COALESCE(SUM("finalTotal"), 0) AS total
        FROM "Quotation"
        WHERE status = 'APPROVED' AND date >= ${sixMonthsAgo}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ]);

    const revenueTrend = trendRows.map((row) => ({
      month: new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
        new Date(row.month)
      ),
      total: Number(row.total),
    }));

    return NextResponse.json({
      counts: { total, approved, pending, rejected, draft },
      totalSales: Number(approvedAgg._sum.finalTotal ?? 0),
      monthlyRevenue: Number(monthlyAgg._sum.finalTotal ?? 0),
      revenueTrend,
      recentQuotations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
