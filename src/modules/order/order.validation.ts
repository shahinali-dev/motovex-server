import { z } from "zod";
import { OrderStatus } from "./order.enum";

const orderItemInputSchema = z.object({
  product: z.string().min(1, "product id is required"),
  quantity: z.number().positive("quantity must be greater than 0"),
  unit: z.enum(["box", "pieces"]),
  // Optional shop-specific override of this product's selling price.
  unitSellingPrice: z.number().min(0).optional(),
});

const createOrderValidationSchema = z.object({
  shop: z.string().min(1, "shop id is required"),
  items: z.array(orderItemInputSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  orderDate: z.string().optional(),
});

const updateOrderStatusValidationSchema = z.object({
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.RETURNED,
  ]),
  note: z.string().optional(),
});

const adjustOrderItemValidationSchema = z.object({
  quantity: z.number().positive("quantity must be greater than 0"),
  unit: z.enum(["box", "pieces"]),
  note: z.string().optional(),
});

export const orderValidation = {
  createOrderValidationSchema,
  updateOrderStatusValidationSchema,
  adjustOrderItemValidationSchema,
};
