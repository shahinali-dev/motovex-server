import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import {
  getPagination,
  resolveDateRange,
} from "../../utils/query_helpers.utils";
import { toPieces } from "../../utils/stock_unit.utils";
import { storageService } from "../../utils/storage";
import ProductModel from "../product/product.model";
import SupplierModel from "../supplier/supplier.model";
import { StockMovementType } from "../stock/stock.enum";
import { stockService } from "../stock/stock.service";
import {
  derivePurchasePaymentStatus,
  PurchaseStatus,
} from "./purchase.enum";
import { IPurchaseItem, IPurchaseItemInput } from "./purchase.interface";
import PurchaseModel from "./purchase.model";

const ALLOWED_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  [PurchaseStatus.PENDING]: [PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED],
  [PurchaseStatus.RECEIVED]: [PurchaseStatus.RETURNED],
  [PurchaseStatus.CANCELLED]: [],
  [PurchaseStatus.RETURNED]: [],
};

interface ICreatePurchasePayload {
  supplier: string;
  invoiceNumber?: string;
  items: IPurchaseItemInput[];
  notes?: string;
  purchaseDate?: string;
}

export class PurchaseService {
  async createPurchase(payload: ICreatePurchasePayload, userId: Types.ObjectId) {
    const supplier = await SupplierModel.findById(payload.supplier);
    if (!supplier)
      throw new AppError(httpStatus.NOT_FOUND, "Supplier not found");
    if (supplier.isActive === false) {
      throw new AppError(httpStatus.BAD_REQUEST, "This supplier is inactive");
    }

    const productIds = payload.items.map((i) => i.product);
    const products = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const items: IPurchaseItem[] = payload.items.map((item) => {
      const product = productMap.get(item.product);
      if (!product) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          `Product ${item.product} not found`
        );
      }

      const totalPieces = toPieces(
        item.quantity,
        item.unit,
        product.piecesPerBox
      );
      const unitCostPrice = item.unitCostPrice ?? product.costPricePerPiece;

      return {
        product: product._id as Types.ObjectId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit: item.unit,
        piecesPerBoxSnapshot: product.piecesPerBox,
        totalPieces,
        unitCostPrice,
        subtotalCost: totalPieces * unitCostPrice,
      };
    });

    const totalAmount = items.reduce((sum, i) => sum + i.subtotalCost, 0);

    const purchase = await PurchaseModel.create({
      supplier: supplier._id,
      invoiceNumber: payload.invoiceNumber,
      items,
      totalAmount,
      status: PurchaseStatus.PENDING,
      purchaseDate: payload.purchaseDate
        ? new Date(payload.purchaseDate)
        : new Date(),
      notes: payload.notes,
      createdBy: userId,
    });

    return purchase;
  }

  async getAllPurchases(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.supplier) filter.supplier = query.supplier;
    if (query.status) filter.status = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    if (query.startDate || query.endDate) {
      const { startDate, endDate } = resolveDateRange(
        query.startDate as string | undefined,
        query.endDate as string | undefined
      );
      filter.purchaseDate = { $gte: startDate, $lte: endDate };
    }

    const [data, total] = await Promise.all([
      PurchaseModel.find(filter)
        .sort({ purchaseDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("supplier", "supplierName contactInfo")
        .populate("createdBy", "name email"),
      PurchaseModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPurchaseById(id: string) {
    const purchase = await PurchaseModel.findById(id)
      .populate("supplier", "supplierName contactInfo")
      .populate("createdBy", "name email");
    if (!purchase)
      throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");
    return purchase;
  }

  async updateStatus(
    id: string,
    newStatus: PurchaseStatus,
    userId: Types.ObjectId,
    note?: string
  ) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase)
      throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");

    const allowed = ALLOWED_TRANSITIONS[purchase.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot change purchase status from "${purchase.status}" to "${newStatus}"`
      );
    }

    if (newStatus === PurchaseStatus.RETURNED && purchase.paidAmount > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This purchase has ${purchase.paidAmount} already paid to the supplier. Resolve/refund that payment before marking it "returned".`
      );
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        if (newStatus === PurchaseStatus.RECEIVED) {
          for (const item of purchase.items) {
            await stockService.recordMovement({
              productId: item.product,
              type: StockMovementType.PURCHASE_IN,
              signedQuantityPieces: item.totalPieces,
              note: note || `Purchase ${purchase._id} received`,
              performedBy: userId,
              session,
              preventNegative: false,
            });

            await ProductModel.findByIdAndUpdate(
              item.product,
              { costPricePerPiece: item.unitCostPrice },
              { session }
            );
          }
        }

        if (newStatus === PurchaseStatus.RETURNED) {
          for (const item of purchase.items) {
            await stockService.recordMovement({
              productId: item.product,
              type: StockMovementType.PURCHASE_RETURN,
              signedQuantityPieces: -item.totalPieces,
              note: note || `Purchase ${purchase._id} returned to supplier`,
              performedBy: userId,
              session,
              preventNegative: true,
            });
          }
        }

        purchase.status = newStatus;
        await purchase.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return purchase;
  }

  async recordPayment(
    id: string,
    amount: number,
    userId: Types.ObjectId,
    note?: string,
    file?: Express.Multer.File
  ) {
    const purchase = await PurchaseModel.findById(id);
    if (!purchase)
      throw new AppError(httpStatus.NOT_FOUND, "Purchase not found");

    if (
      purchase.status === PurchaseStatus.CANCELLED ||
      purchase.status === PurchaseStatus.RETURNED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot record a payment against a "${purchase.status}" purchase`
      );
    }

    const newPaidAmount = purchase.paidAmount + amount;
    if (newPaidAmount > purchase.totalAmount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Payment (${amount}) exceeds the remaining due (${
          purchase.totalAmount - purchase.paidAmount
        })`
      );
    }

    let attachmentUrl: string | undefined;
    if (file) {
      const uploaded = await storageService.uploadFile(
        file,
        `purchases/${purchase._id}`
      );
      attachmentUrl = uploaded.url;
    }

    purchase.paidAmount = newPaidAmount;
    purchase.paymentStatus = derivePurchasePaymentStatus(
      purchase.totalAmount,
      newPaidAmount
    );
    purchase.paymentHistory.push({
      amount,
      note,
      attachmentUrl,
      paidBy: userId,
      paidAt: new Date(),
    });
    await purchase.save();

    return purchase;
  }

  async getDueSuppliers() {
    const purchases = await PurchaseModel.find({
      paymentStatus: { $in: ["unpaid", "partial"] },
      status: { $ne: PurchaseStatus.CANCELLED },
    }).populate("supplier", "supplierName contactInfo");

    const bySupplier = new Map<
      string,
      { supplier: unknown; totalDue: number; totalBilled: number; totalPaid: number; dueCount: number }
    >();

    for (const p of purchases) {
      const key = String(p.supplier);
      const existing = bySupplier.get(key) || {
        supplier: p.supplier,
        totalDue: 0,
        totalBilled: 0,
        totalPaid: 0,
        dueCount: 0,
      };
      existing.totalDue += p.totalAmount - p.paidAmount;
      existing.totalBilled += p.totalAmount;
      existing.totalPaid += p.paidAmount;
      existing.dueCount += 1;
      bySupplier.set(key, existing);
    }

    return Array.from(bySupplier.values()).sort(
      (a, b) => b.totalDue - a.totalDue
    );
  }
}

export const purchaseService = new PurchaseService();
