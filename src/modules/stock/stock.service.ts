import httpStatus from "http-status";
import { ClientSession, Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import ProductModel from "../product/product.model";
import { StockMovementType } from "./stock.enum";
import StockLogModel from "./stock_log.model";

interface IRecordMovementOptions {
  productId: string | Types.ObjectId;
  type: StockMovementType;
  // Signed: positive increases stock, negative decreases stock.
  signedQuantityPieces: number;
  note?: string;
  orderId?: string | Types.ObjectId;
  performedBy?: string | Types.ObjectId;
  session?: ClientSession;
  // When true, throws if the movement would push stock below 0.
  preventNegative?: boolean;
}

export class StockService {
  async recordMovement(options: IRecordMovementOptions) {
    const {
      productId,
      type,
      signedQuantityPieces,
      note,
      orderId,
      performedBy,
      session,
      preventNegative = true,
    } = options;

    const product = await ProductModel.findById(productId).session(
      session ?? null
    );
    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const newStock = product.stockInPieces + signedQuantityPieces;

    if (preventNegative && newStock < 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Insufficient stock for "${product.name}". Available: ${product.stockInPieces} pcs, requested: ${Math.abs(
          signedQuantityPieces
        )} pcs`
      );
    }

    product.stockInPieces = newStock;
    await product.save({ session });

    const [log] = await StockLogModel.create(
      [
        {
          product: product._id,
          type,
          quantityPieces: signedQuantityPieces,
          stockAfterPieces: newStock,
          note,
          order: orderId,
          performedBy,
        },
      ],
      { session }
    );

    return { product, log };
  }

  async getLogsForProduct(productId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = { product: productId };
    if (query.type) filter.type = query.type;

    const [data, total] = await Promise.all([
      StockLogModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("performedBy", "name email")
        .populate("order", "status"),
      StockLogModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const stockService = new StockService();
