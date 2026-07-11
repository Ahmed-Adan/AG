import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  companyName: z.string().optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type CustomerInput = z.infer<typeof customerSchema>;
