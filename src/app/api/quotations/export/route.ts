import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/api";
import type { QuotationStatus } from "@/types";

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
              ],
            }
          : {}),
      },
      include: { customer: true, preparedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Alhatimi Glass and Glazing";
    const sheet = workbook.addWorksheet("Quotations");

    sheet.columns = [
      { header: "Quotation No.", key: "quotationNumber", width: 18 },
      { header: "Customer", key: "customer", width: 24 },
      { header: "Company", key: "company", width: 24 },
      { header: "Project", key: "project", width: 28 },
      { header: "Date", key: "date", width: 14 },
      { header: "Valid Until", key: "validUntil", width: 14 },
      { header: "Status", key: "status", width: 12 },
      { header: "Subtotal", key: "subTotal", width: 14 },
      { header: "Discount", key: "discountAmount", width: 14 },
      { header: "VAT", key: "vatAmount", width: 12 },
      { header: "Final Total", key: "finalTotal", width: 14 },
      { header: "Prepared By", key: "preparedBy", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    quotations.forEach((q) => {
      sheet.addRow({
        quotationNumber: q.quotationNumber,
        customer: q.customer.name,
        company: q.customer.companyName ?? "",
        project: q.projectName,
        date: q.date.toISOString().slice(0, 10),
        validUntil: q.validUntil ? q.validUntil.toISOString().slice(0, 10) : "",
        status: q.status,
        subTotal: Number(q.subTotal),
        discountAmount: Number(q.discountAmount),
        vatAmount: Number(q.vatAmount),
        finalTotal: Number(q.finalTotal),
        preparedBy: q.preparedBy.name,
      });
    });

    ["subTotal", "discountAmount", "vatAmount", "finalTotal"].forEach((key) => {
      sheet.getColumn(key).numFmt = "#,##0.00";
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="quotations-export.xlsx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
