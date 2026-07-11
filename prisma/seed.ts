import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { allocateQuotationSequence, formatQuotationNumber } from "../src/lib/quotation-number";
import { computeQuotationTotals, computeLineItem } from "../src/lib/calculations";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      companyName: "Alhatimi Glass and Glazing",
      logoUrl: "/logo.jpg",
      address: "Industrial Area, Dubai, United Arab Emirates",
      phone: "+971 50 000 0000",
      email: "info@alhatimiglass.com",
      website: "www.alhatimiglass.com",
      currency: "USD",
      defaultTaxPercent: 5,
      defaultDiscountPercent: 0,
      footerText: "Thank you for choosing Alhatimi Glass and Glazing.",
      termsAndConditions:
        "1. This quotation is valid for the period stated above.\n" +
        "2. 50% advance payment is required to confirm the order, balance on completion.\n" +
        "3. Delivery and installation timelines are estimates and may vary based on site conditions.\n" +
        "4. Any changes to the scope of work after approval may affect pricing and timeline.\n" +
        "5. Warranty covers manufacturing defects only, as per standard industry practice.",
    },
  });

  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@alhatimiglass.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@alhatimiglass.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const managerHash = await bcrypt.hash("Manager@123", 12);
  await prisma.user.upsert({
    where: { email: "manager@alhatimiglass.com" },
    update: {},
    create: {
      name: "Manager User",
      email: "manager@alhatimiglass.com",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  });

  const staffHash = await bcrypt.hash("Staff@123", 12);
  await prisma.user.upsert({
    where: { email: "staff@alhatimiglass.com" },
    update: {},
    create: {
      name: "Staff User",
      email: "staff@alhatimiglass.com",
      passwordHash: staffHash,
      role: "STAFF",
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: "seed-customer-1" },
    update: {},
    create: {
      id: "seed-customer-1",
      name: "Ahmed Al Falasi",
      companyName: "Falasi Real Estate LLC",
      phone: "+971501234567",
      email: "ahmed@falasirealestate.ae",
      address: "Sheikh Zayed Road, Dubai, UAE",
    },
  });

  const existingSample = await prisma.quotation.findFirst({
    where: { projectName: "Marina Tower — Curtain Wall Glazing" },
  });

  if (!existingSample) {
    const items = [
      {
        position: 1,
        description: "Double glazed unit (DGU) curtain wall panel",
        category: "Curtain Wall",
        width: 1.5,
        height: 3.0,
        quantity: 12,
        unitPrice: 220,
        discountType: "PERCENT" as const,
        discountValue: 0,
      },
      {
        position: 2,
        description: "Aluminium sliding window, thermal break profile",
        category: "Windows",
        width: 1.2,
        height: 1.5,
        quantity: 8,
        unitPrice: 180,
        discountType: "PERCENT" as const,
        discountValue: 5,
      },
      {
        position: 3,
        description: "Frameless glass door, tempered 12mm",
        category: "Doors",
        width: 1.0,
        height: 2.4,
        quantity: 4,
        unitPrice: 450,
        discountType: "FIXED" as const,
        discountValue: 50,
      },
    ];

    const totals = computeQuotationTotals(items, "PERCENT", 2, 5);
    const year = new Date().getFullYear();

    await prisma.$transaction(async (tx) => {
      const sequence = await allocateQuotationSequence(tx, year);
      const quotationNumber = formatQuotationNumber(year, sequence);

      await tx.quotation.create({
        data: {
          quotationNumber,
          year,
          sequence,
          customerId: customer.id,
          projectName: "Marina Tower — Curtain Wall Glazing",
          projectLocation: "Dubai Marina, Dubai, UAE",
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "PENDING",
          subTotal: totals.subTotal,
          discountType: "PERCENT",
          discountValue: 2,
          discountAmount: totals.discountAmount,
          vatPercent: 5,
          vatAmount: totals.vatAmount,
          grandTotal: totals.grandTotal,
          finalTotal: totals.finalTotal,
          preparedById: admin.id,
          notes: "Sample seeded quotation for demo purposes.",
          termsAndConditions:
            "1. This quotation is valid for the period stated above.\n" +
            "2. 50% advance payment is required to confirm the order, balance on completion.",
          items: {
            create: items.map((item) => {
              const { area, amount } = computeLineItem(item);
              return {
                position: item.position,
                description: item.description,
                category: item.category,
                width: item.width,
                height: item.height,
                quantity: item.quantity,
                area,
                unitPrice: item.unitPrice,
                discountType: item.discountType,
                discountValue: item.discountValue,
                amount,
              };
            }),
          },
        },
      });
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:   admin@alhatimiglass.com / Admin@123");
  console.log("Manager login: manager@alhatimiglass.com / Manager@123");
  console.log("Staff login:   staff@alhatimiglass.com / Staff@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
