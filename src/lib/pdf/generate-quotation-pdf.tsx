import path from "node:path";
import fs from "node:fs";
import { renderToBuffer } from "@react-pdf/renderer";

import { prisma } from "@/lib/prisma";
import { QUOTATION_INCLUDE } from "@/lib/quotation-service";
import { QuotationDocument, type QuotationPdfData } from "@/components/pdf/quotation-document";

function resolveLogoPath(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  const relative = logoUrl.startsWith("/") ? logoUrl.slice(1) : logoUrl;
  const absolute = path.join(process.cwd(), "public", relative);
  return fs.existsSync(absolute) ? absolute : null;
}

export async function generateQuotationPdf(quotationId: string): Promise<Buffer | null> {
  const [quotation, settings] = await Promise.all([
    prisma.quotation.findUnique({
      where: { id: quotationId },
      include: QUOTATION_INCLUDE,
    }),
    prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    }),
  ]);

  if (!quotation) return null;

  const data: QuotationPdfData = {
    quotationNumber: quotation.quotationNumber,
    date: quotation.date.toISOString(),
    validUntil: quotation.validUntil ? quotation.validUntil.toISOString() : null,
    status: quotation.status,
    customer: {
      name: quotation.customer.name,
      companyName: quotation.customer.companyName,
      phone: quotation.customer.phone,
      email: quotation.customer.email,
      address: quotation.customer.address,
    },
    projectName: quotation.projectName,
    projectLocation: quotation.projectLocation,
    items: quotation.items.map((item) => ({
      position: item.position,
      description: item.description,
      width: Number(item.width),
      height: Number(item.height),
      quantity: Number(item.quantity),
      area: Number(item.area),
      unitPrice: Number(item.unitPrice),
      discountType: item.discountType,
      discountValue: Number(item.discountValue),
      amount: Number(item.amount),
    })),
    subTotal: Number(quotation.subTotal),
    discountType: quotation.discountType,
    discountValue: Number(quotation.discountValue),
    discountAmount: Number(quotation.discountAmount),
    vatPercent: Number(quotation.vatPercent),
    vatAmount: Number(quotation.vatAmount),
    grandTotal: Number(quotation.grandTotal),
    finalTotal: Number(quotation.finalTotal),
    notes: quotation.notes,
    termsAndConditions: quotation.termsAndConditions,
    preparedByName: quotation.preparedBy.name,
    company: {
      companyName: settings.companyName,
      logoPath: resolveLogoPath(settings.logoUrl),
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      currency: settings.currency,
      footerText: settings.footerText,
    },
  };

  const buffer = await renderToBuffer(<QuotationDocument data={data} />);
  return buffer;
}
