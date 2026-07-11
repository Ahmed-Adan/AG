-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "customerId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectLocation" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "subTotal" DECIMAL(12,2) NOT NULL,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "finalTotal" DECIMAL(12,2) NOT NULL,
    "preparedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "termsAndConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "width" DECIMAL(10,3) NOT NULL,
    "height" DECIMAL(10,3) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "area" DECIMAL(12,4) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "discountType" "DiscountType" NOT NULL DEFAULT 'PERCENT',
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "companyName" TEXT NOT NULL DEFAULT 'Alhatimi Glass and Glazing',
    "logoUrl" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "defaultTaxPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "defaultDiscountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "footerText" TEXT NOT NULL DEFAULT 'Thank you for choosing Alhatimi Glass and Glazing.',
    "termsAndConditions" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationCounter" (
    "year" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuotationCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_date_idx" ON "Quotation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_year_sequence_key" ON "Quotation"("year", "sequence");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_description_idx" ON "QuotationItem"("description");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
