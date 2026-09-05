import { z } from "zod";
import { PurchaseStatus } from "./purchase.enum";

const purchaseItemSchema = z.object({
  product: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.enum(["box", "pieces"]),
  unitCostPrice: z.number().min(0).optional(),
  updateProductCostPrice: z.boolean().optional(),
});

const createPurchaseValidationSchema = z.object({
  supplier: z.string().min(1, "Supplier is required"),
  invoiceNumber: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
});

const updatePurchaseStatusValidationSchema = z.object({
  status: z.enum([
    PurchaseStatus.PENDING,
    PurchaseStatus.RECEIVED,
    PurchaseStatus.CANCELLED,
    PurchaseStatus.RETURNED,
  ]),
  note: z.string().optional(),
});

const recordPurchasePaymentValidationSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
});

export const purchaseValidation = {
  createPurchaseValidationSchema,
  updatePurchaseStatusValidationSchema,
  recordPurchasePaymentValidationSchema,
};
