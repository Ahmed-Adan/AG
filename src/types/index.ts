export type Role = "ADMIN" | "MANAGER" | "STAFF";
export type QuotationStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type DiscountType = "PERCENT" | "FIXED";

export interface CustomerSummary {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { quotations: number };
}

export interface CustomerQuotationRow {
  id: string;
  quotationNumber: string;
  projectName: string;
  status: QuotationStatus;
  finalTotal: string;
  date: string;
}

export interface CustomerDetail extends CustomerSummary {
  quotations: CustomerQuotationRow[];
}

export interface QuotationItemDTO {
  id?: string;
  position: number;
  description: string;
  category: string | null;
  width: string | number;
  height: string | number;
  quantity: string | number;
  area: string | number;
  unitPrice: string | number;
  discountType: DiscountType;
  discountValue: string | number;
  amount: string | number;
}

export interface QuotationDTO {
  id: string;
  quotationNumber: string;
  year: number;
  sequence: number;
  customerId: string;
  customer: CustomerSummary;
  projectName: string;
  projectLocation: string | null;
  date: string;
  validUntil: string | null;
  status: QuotationStatus;
  items: QuotationItemDTO[];
  subTotal: string;
  discountType: DiscountType;
  discountValue: string;
  discountAmount: string;
  vatPercent: string;
  vatAmount: string;
  grandTotal: string;
  finalTotal: string;
  preparedById: string;
  preparedBy: { id: string; name: string };
  approvedById: string | null;
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;
  notes: string | null;
  termsAndConditions: string | null;
  createdAt: string;
  updatedAt: string;
}
