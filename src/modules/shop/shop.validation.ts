import { z } from "zod";

const contactInfoSchema = z.object({
  phone: z.string().min(1, "Contact phone is required"),
  email: z.string().email("Invalid email").optional(),
  address: z.string().optional(),
});

const createShopValidationSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Shop owner name is required"),
  contactInfo: contactInfoSchema,
  note: z.string().optional(),
});

const updateShopValidationSchema = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  contactInfo: contactInfoSchema.partial().optional(),
  note: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const shopValidation = {
  createShopValidationSchema,
  updateShopValidationSchema,
};
