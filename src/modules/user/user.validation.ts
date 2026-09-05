import { z } from "zod";
import { Role } from "./user.enum";

const allRoles = [
  Role.ADMIN,
  Role.MANAGER,
  Role.STAFF,
  Role.DM,
  Role.DSR,
  Role.SR,
] as const;

const createUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(allRoles).optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  territory: z.string().optional(),
  reportsTo: z.string().optional(), // ObjectId of a DM/DSR this user reports to
});

const updateUserValidationSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(allRoles).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  territory: z.string().optional(),
  reportsTo: z.string().nullable().optional(),
});

const forgotPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email format"),
});

const resetPasswordValidationSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const userValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
};
