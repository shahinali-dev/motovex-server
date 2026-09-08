import { z } from "zod";

const contactInfoSchema = z.object({
  phone: z.string().min(1, "Contact phone is required"),
  email: z.string().email("Invalid email").optional(),
});

const addressSchema = z.object({
  bazar: z.string().min(1, "Bazar (local address) is required"),
  thana: z.string().min(1, "Thana is required"),
  zila: z.string().min(1, "Zila is required"),
});

const createShopValidationSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  ownerName: z.string().min(1, "Shop owner name is required"),
  contactInfo: contactInfoSchema,
  address: addressSchema,
  note: z.string().optional(),
});

const updateShopValidationSchema = z.object({
  shopName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  contactInfo: contactInfoSchema.partial().optional(),
  address: addressSchema.partial().optional(),
  note: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const shopValidation = {
  createShopValidationSchema,
  updateShopValidationSchema,
};
