/**
 * Production seed: creates the company settings row and exactly one Admin
 * account with credentials you choose. Does NOT create demo Manager/Staff
 * accounts or a sample quotation (those live in prisma/seed.ts for local dev).
 *
 * Usage:
 *   DATABASE_URL="<production connection string>" \
 *   ADMIN_NAME="Your Name" \
 *   ADMIN_EMAIL="you@alhatimiglass.com" \
 *   ADMIN_PASSWORD="a-strong-password" \
 *   npx tsx scripts/seed-production.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Missing required env vars. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD."
  );
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

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

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD!, 12);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL! },
    update: { name: ADMIN_NAME!, passwordHash, role: "ADMIN", isActive: true },
    create: { name: ADMIN_NAME!, email: ADMIN_EMAIL!, passwordHash, role: "ADMIN" },
  });

  console.log(`Production seed complete. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
