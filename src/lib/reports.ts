import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "customer"
  | "sales"
  | "product";

export interface ReportFilters {
  from?: string | null;
  to?: string | null;
  customerId?: string | null;
  status?: string | null;
}

const TIME_UNIT: Record<"daily" | "weekly" | "monthly" | "yearly", string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

function buildDateFilter(filters: ReportFilters) {
  const clauses: Prisma.Sql[] = [];
  if (filters.from) clauses.push(Prisma.sql`q.date >= ${new Date(filters.from)}`);
  if (filters.to) clauses.push(Prisma.sql`q.date <= ${new Date(filters.to)}`);
  if (filters.status) clauses.push(Prisma.sql`q.status = ${filters.status}`);
  if (filters.customerId) clauses.push(Prisma.sql`q."customerId" = ${filters.customerId}`);
  if (clauses.length === 0) return Prisma.sql`TRUE`;
  return Prisma.join(clauses, " AND ");
}

export async function getTimeBucketedReport(
  type: "daily" | "weekly" | "monthly" | "yearly",
  filters: ReportFilters
) {
  const unit = TIME_UNIT[type];
  const where = buildDateFilter(filters);

  const rows = await prisma.$queryRaw<
    { bucket: Date; count: bigint; total: string }[]
  >(Prisma.sql`
    SELECT date_trunc(${unit}, q.date) AS bucket, COUNT(*) AS count, COALESCE(SUM(q."finalTotal"), 0) AS total
    FROM "Quotation" q
    WHERE ${where}
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 100
  `);

  return rows.map((row) => ({
    period: row.bucket.toISOString(),
    count: Number(row.count),
    total: Number(row.total),
  }));
}

export async function getCustomerReport(filters: ReportFilters) {
  const rows = await prisma.$queryRaw<
    { customerId: string; name: string; companyName: string | null; count: bigint; total: string }[]
  >(Prisma.sql`
    SELECT q."customerId", c.name, c."companyName", COUNT(*) AS count, COALESCE(SUM(q."finalTotal"), 0) AS total
    FROM "Quotation" q
    JOIN "Customer" c ON c.id = q."customerId"
    WHERE ${buildDateFilter(filters)}
    GROUP BY q."customerId", c.name, c."companyName"
    ORDER BY total DESC
    LIMIT 200
  `);

  return rows.map((row) => ({
    customerId: row.customerId,
    name: row.name,
    companyName: row.companyName,
    count: Number(row.count),
    total: Number(row.total),
  }));
}

export async function getProductReport(filters: ReportFilters) {
  const rows = await prisma.$queryRaw<
    {
      description: string;
      category: string | null;
      count: bigint;
      quantity: string;
      area: string;
      amount: string;
    }[]
  >(Prisma.sql`
    SELECT i.description, i.category, COUNT(*) AS count,
           COALESCE(SUM(i.quantity), 0) AS quantity,
           COALESCE(SUM(i.area), 0) AS area,
           COALESCE(SUM(i.amount), 0) AS amount
    FROM "QuotationItem" i
    JOIN "Quotation" q ON q.id = i."quotationId"
    WHERE ${buildDateFilter(filters)}
    GROUP BY i.description, i.category
    ORDER BY amount DESC
    LIMIT 200
  `);

  return rows.map((row) => ({
    description: row.description,
    category: row.category,
    count: Number(row.count),
    quantity: Number(row.quantity),
    area: Number(row.area),
    amount: Number(row.amount),
  }));
}

export async function getSalesReport(filters: ReportFilters) {
  const where = buildDateFilter(filters);

  const [statusBreakdown, monthly] = await Promise.all([
    prisma.$queryRaw<{ status: string; count: bigint; total: string }[]>(Prisma.sql`
      SELECT q.status, COUNT(*) AS count, COALESCE(SUM(q."finalTotal"), 0) AS total
      FROM "Quotation" q
      WHERE ${where}
      GROUP BY q.status
    `),
    getTimeBucketedReport("monthly", filters),
  ]);

  const totalCount = statusBreakdown.reduce((sum, row) => sum + Number(row.count), 0);
  const approvedRow = statusBreakdown.find((r) => r.status === "APPROVED");
  const approvedCount = approvedRow ? Number(approvedRow.count) : 0;
  const approvedRevenue = approvedRow ? Number(approvedRow.total) : 0;

  return {
    statusBreakdown: statusBreakdown.map((row) => ({
      status: row.status,
      count: Number(row.count),
      total: Number(row.total),
    })),
    totalCount,
    approvedCount,
    approvedRevenue,
    approvalRate: totalCount > 0 ? approvedCount / totalCount : 0,
    averageApprovedValue: approvedCount > 0 ? approvedRevenue / approvedCount : 0,
    trend: monthly.slice(0, 12).reverse(),
  };
}
