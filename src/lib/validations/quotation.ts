import { z } from "zod";

export const discountTypeEnum = z.enum(["PERCENT", "FIXED"]);

export const quotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  category: z.string().optional().or(z.literal("")),
  width: z.coerce.number().positive("Width must be greater than 0"),
  height: z.coerce.number().positive("Height must be greater than 0"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
  discountType: discountTypeEnum.default("PERCENT"),
  discountValue: z.coerce.number().min(0).default(0),
});

export const quotationSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectLocation: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().optional().or(z.literal("")),
  discountType: discountTypeEnum.default("PERCENT"),
  discountValue: z.coerce.number().min(0).default(0),
  vatPercent: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional().or(z.literal("")),
  termsAndConditions: z.string().optional().or(z.literal("")),
  items: z.array(quotationItemSchema).min(1, "Add at least one line item"),
});

/** Coerced/validated shape (numbers), used server-side after parsing. */
export type QuotationInput = z.infer<typeof quotationSchema>;
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;

/** Raw form shape before zod coercion, used as the react-hook-form generic. */
export type QuotationFormValues = z.input<typeof quotationSchema>;
