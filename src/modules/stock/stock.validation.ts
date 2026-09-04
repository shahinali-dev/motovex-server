import { z } from "zod";

const adjustStockValidationSchema = z.object({
  quantity: z.number().positive("quantity must be greater than 0"),
  unit: z.enum(["box", "pieces"]),
  direction: z.enum(["in", "out"]),
  note: z.string().optional(),
});

export const stockValidation = {
  adjustStockValidationSchema,
};
