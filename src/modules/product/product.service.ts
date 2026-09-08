import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import { generateSku } from "../../utils/sku_generator.utils";
import { toPieces } from "../../utils/stock_unit.utils";
import { categoryService } from "../category/category.service";
import { StockMovementType } from "../stock/stock.enum";
import { stockService } from "../stock/stock.service";
import { IProduct } from "./product.interface";
import ProductModel from "./product.model";

interface ICreateProductPayload extends IProduct {
  openingStock?: { quantity: number; unit: "box" | "pieces" };
}

export class ProductService {
  async createProduct(payload: ICreateProductPayload, userId: Types.ObjectId) {
    const { openingStock, ...rest } = payload;
    const productData = { ...rest };

    // SKU: use whatever the UI provided (manual override); otherwise
    // auto-generate one from category + brand.
    if (productData.sku && productData.sku.trim()) {
      const existing = await ProductModel.findOne({ sku: productData.sku });
      if (existing) {
        throw new AppError(httpStatus.BAD_REQUEST, "SKU already exists");
      }
    } else {
      productData.sku = await generateSku(productData.category, productData.brand);
    }

    // Category: if a category name was given, resolve (or create) the
    // matching Category doc so categoryId stays in sync for filtering.
    if (productData.category && productData.category.trim()) {
      const category = await categoryService.findOrCreateByName(
        productData.category,
        userId
      );
      if (category) {
        productData.category = category.name;
        productData.categoryId = category._id;
      }
    }

    const product = await ProductModel.create({
      ...productData,
      stockInPieces: 0,
      createdBy: userId,
    });

    if (openingStock && openingStock.quantity > 0) {
      const pieces = toPieces(
        openingStock.quantity,
        openingStock.unit,
        product.piecesPerBox
      );
      await stockService.recordMovement({
        productId: product._id,
        type: StockMovementType.OPENING,
        signedQuantityPieces: pieces,
        note: "Opening stock",
        performedBy: userId,
      });
    }

    return ProductModel.findById(product._id);
  }

  async getAllProducts(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    if (query.category) filter.category = query.category;
    if (query.brand) filter.brand = query.brand;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { sku: { $regex: query.search, $options: "i" } },
        { brand: { $regex: query.search, $options: "i" } },
      ];
    }
    if (query.lowStock === "true") {
      filter.$expr = { $lte: ["$stockInPieces", "$lowStockThresholdPieces"] };
    }

    const [data, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ProductModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getProductById(id: string) {
    const product = await ProductModel.findById(id);
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    return product;
  }

  async updateProduct(id: string, payload: Partial<IProduct>) {
    const updateData = { ...payload };

    if (updateData.category && updateData.category.trim()) {
      const category = await categoryService.findOrCreateByName(
        updateData.category
      );
      if (category) {
        updateData.category = category.name;
        updateData.categoryId = category._id;
      }
    }

    const product = await ProductModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    return product;
  }

  /**
   * Distinct list of brand names already in use, for the "search existing /
   * add new" brand dropdown on the product form. Brands are handled
   * dynamically (no separate Brand collection) — this just reads whatever
   * free-text brand values products already carry.
   */
  async getDistinctBrands(search?: string) {
    const filter: Record<string, unknown> = {
      brand: { $exists: true, $nin: [null, ""] },
    };
    if (search) {
      filter.brand = { $regex: search, $options: "i" };
    }
    const brands = await ProductModel.distinct("brand", filter);
    return (brands as string[]).sort((a, b) => a.localeCompare(b));
  }

  async deleteProduct(id: string) {
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    return product;
  }
}

export const productService = new ProductService();
