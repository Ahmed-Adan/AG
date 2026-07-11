import { z } from "zod";

export const settingsSchema = z.object({
  companyName: z.string().min(1).optional(),
  logoUrl: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  website: z.string().optional().nullable(),
  currency: z.string().min(1).optional(),
  defaultTaxPercent: z.coerce.number().min(0).max(100).optional(),
  defaultDiscountPercent: z.coerce.number().min(0).max(100).optional(),
  footerText: z.string().optional(),
  termsAndConditions: z.string().optional().nullable(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
export type SettingsFormValues = z.input<typeof settingsSchema>;
