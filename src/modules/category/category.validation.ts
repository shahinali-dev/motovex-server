import { z } from "zod";

const createCategoryValidationSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

const updateCategoryValidationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};
