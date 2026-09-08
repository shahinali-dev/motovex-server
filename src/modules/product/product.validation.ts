import { z } from "zod";

const createProductValidationSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  // Optional: leave blank in the UI to auto-generate from category + brand.
  sku: z.string().min(1).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  piecesPerBox: z.number().int().positive("piecesPerBox must be >= 1").default(12),
  costPricePerPiece: z.number().nonnegative(),
  sellingPricePerPiece: z.number().nonnegative(),
  boxCostPrice: z.number().nonnegative().optional(),
  boxSellingPrice: z.number().nonnegative().optional(),
  lowStockThresholdPieces: z.number().int().nonnegative().optional(),
  // Optional opening stock, provided in either box or pieces.
  openingStock: z
    .object({
      quantity: z.number().nonnegative(),
      unit: z.enum(["box", "pieces"]),
    })
    .optional(),
});

const updateProductValidationSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  piecesPerBox: z.number().int().positive().optional(),
  costPricePerPiece: z.number().nonnegative().optional(),
  sellingPricePerPiece: z.number().nonnegative().optional(),
  boxCostPrice: z.number().nonnegative().optional(),
  boxSellingPrice: z.number().nonnegative().optional(),
  lowStockThresholdPieces: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const productValidation = {
  createProductValidationSchema,
  updateProductValidationSchema,
};
