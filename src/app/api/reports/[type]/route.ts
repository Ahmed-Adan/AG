import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { requireSession, handleApiError } from "@/lib/api";
import { requirePermission } from "@/lib/permissions";
import {
  getTimeBucketedReport,
  getCustomerReport,
  getProductReport,
  getSalesReport,
  type ReportType,
} from "@/lib/reports";

type RouteContext = { params: Promise<{ type: string }> };

const TIME_TYPES = ["daily", "weekly", "monthly", "yearly"] as const;

async function buildReportData(type: string, filters: { from?: string | null; to?: string | null; customerId?: string | null; status?: string | null }) {
  if ((TIME_TYPES as readonly string[]).includes(type)) {
    return getTimeBucketedReport(type as (typeof TIME_TYPES)[number], filters);
  }
  if (type === "customer") return getCustomerReport(filters);
  if (type === "product") return getProductReport(filters);
  if (type === "sales") return getSalesReport(filters);
  return null;
}

const EXCEL_COLUMNS: Record<ReportType, { header: string; key: string; width?: number; fmt?: string }[]> = {
  daily: [
    { header: "Period", key: "period", width: 16 },
    { header: "Quotations", key: "count", width: 14 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
  weekly: [
    { header: "Period", key: "period", width: 16 },
    { header: "Quotations", key: "count", width: 14 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
  monthly: [
    { header: "Period", key: "period", width: 16 },
    { header: "Quotations", key: "count", width: 14 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
  yearly: [
    { header: "Period", key: "period", width: 16 },
    { header: "Quotations", key: "count", width: 14 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
  customer: [
    { header: "Customer", key: "name", width: 24 },
    { header: "Company", key: "companyName", width: 24 },
    { header: "Quotations", key: "count", width: 14 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
  product: [
    { header: "Description", key: "description", width: 32 },
    { header: "Category", key: "category", width: 18 },
    { header: "Count", key: "count", width: 10 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Area (m²)", key: "area", width: 14, fmt: "#,##0.00" },
    { header: "Revenue", key: "amount", width: 16, fmt: "#,##0.00" },
  ],
  sales: [
    { header: "Status", key: "status", width: 16 },
    { header: "Count", key: "count", width: 12 },
    { header: "Total", key: "total", width: 16, fmt: "#,##0.00" },
  ],
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    requirePermission(session.user.role, "reports.view");

    const { type } = await params;
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      customerId: searchParams.get("customerId"),
      status: searchParams.get("status"),
    };

    const data = await buildReportData(type, filters);
    if (data === null) {
      return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
    }

    if (searchParams.get("format") === "excel") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Alhatimi Glass and Glazing";
      const sheet = workbook.addWorksheet(type);

      const rows = type === "sales" ? (data as Awaited<ReturnType<typeof getSalesReport>>).statusBreakdown : data;
      const columns = EXCEL_COLUMNS[type as ReportType] ?? [];
      sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };

      (rows as Record<string, unknown>[]).forEach((row) => sheet.addRow(row));
      columns.forEach((c) => {
        if (c.fmt) sheet.getColumn(c.key).numFmt = c.fmt;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="report-${type}.xlsx"`,
        },
      });
    }

    return NextResponse.json({ type, data });
  } catch (error) {
    return handleApiError(error);
  }
}
