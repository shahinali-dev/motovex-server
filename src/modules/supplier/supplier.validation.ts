import { z } from "zod";

const contactInfoSchema = z.object({
  phone: z.string().min(1, "Contact phone is required"),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
});

const createSupplierValidationSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  contactPerson: z.string().optional(),
  contactInfo: contactInfoSchema,
  note: z.string().optional(),
});

const updateSupplierValidationSchema = z.object({
  supplierName: z.string().min(1).optional(),
  contactPerson: z.string().optional(),
  contactInfo: contactInfoSchema.partial().optional(),
  note: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const supplierValidation = {
  createSupplierValidationSchema,
  updateSupplierValidationSchema,
};
