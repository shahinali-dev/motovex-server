import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import { ICategory } from "./category.interface";
import CategoryModel from "./category.model";

export class CategoryService {
  async createCategory(payload: ICategory) {
    const existing = await CategoryModel.findOne({
      name: { $regex: `^${payload.name.trim()}$`, $options: "i" },
    });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, "Category already exists");
    }
    return CategoryModel.create(payload);
  }

  /**
   * Returns the existing category matching this name (case-insensitive), or
   * creates a new one on the fly. Used by the product module so a brand-new
   * category typed in the "add new" field on the product form is
   * automatically registered as a proper category.
   */
  async findOrCreateByName(name: string, createdBy?: ICategory["createdBy"]) {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = await CategoryModel.findOne({
      name: { $regex: `^${trimmed}$`, $options: "i" },
    });
    if (existing) return existing;

    return CategoryModel.create({ name: trimmed, createdBy });
  }

  async getAllCategories(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    // When the dashboard is only populating a dropdown, `all=true` skips
    // pagination and returns every active category sorted alphabetically.
    if (query.all === "true") {
      const data = await CategoryModel.find(filter).sort({ name: 1 });
      return { data, meta: { page: 1, limit: data.length, total: data.length, totalPages: 1 } };
    }

    const [data, total] = await Promise.all([
      CategoryModel.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      CategoryModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCategoryById(id: string) {
    const category = await CategoryModel.findById(id);
    if (!category)
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    return category;
  }

  async updateCategory(id: string, payload: Partial<ICategory>) {
    const category = await CategoryModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!category)
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    return category;
  }

  async deleteCategory(id: string) {
    const category = await CategoryModel.findByIdAndDelete(id);
    if (!category)
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    return category;
  }
}

export const categoryService = new CategoryService();
