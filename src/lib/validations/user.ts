import { z } from "zod";

export const roleEnum = z.enum(["ADMIN", "MANAGER", "STAFF"]);

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
