import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import { toPieces } from "../../utils/stock_unit.utils";
import { StockMovementType } from "../stock/stock.enum";
import { stockService } from "../stock/stock.service";
import { IProduct } from "./product.interface";
import ProductModel from "./product.model";

interface ICreateProductPayload extends IProduct {
  openingStock?: { quantity: number; unit: "box" | "pieces" };
}

export class ProductService {
  async createProduct(payload: ICreateProductPayload, userId: Types.ObjectId) {
    const existing = await ProductModel.findOne({ sku: payload.sku });
    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, "SKU already exists");
    }

    const { openingStock, ...productData } = payload;

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
    const product = await ProductModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    return product;
  }

  async deleteProduct(id: string) {
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product) throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    return product;
  }
}

export const productService = new ProductService();
