import { z } from "zod";
import { Role } from "./user.enum";

const createUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum([Role.ADMIN, Role.MANAGER, Role.STAFF]).optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateUserValidationSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([Role.ADMIN, Role.MANAGER, Role.STAFF]).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const userValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
