import httpStatus from "http-status";
import mongoose, { ClientSession, Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination, resolveDateRange } from "../../utils/query_helpers.utils";
import { toPieces } from "../../utils/stock_unit.utils";
import ProductModel from "../product/product.model";
import ShopModel from "../shop/shop.model";
import { StockMovementType } from "../stock/stock.enum";
import { stockService } from "../stock/stock.service";
import { NON_SALE_STATUSES, OrderStatus } from "./order.enum";
import { IOrderItem, IOrderItemInput } from "./order.interface";
import OrderModel from "./order.model";

// Statuses that (once reached) restock inventory back to the warehouse.
const RESTOCKING_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
};

interface ICreateOrderPayload {
  shop: string;
  items: IOrderItemInput[];
  notes?: string;
  orderDate?: string;
}

export class OrderService {
  async createOrder(payload: ICreateOrderPayload, userId: Types.ObjectId) {
    const shop = await ShopModel.findById(payload.shop);
    if (!shop) throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    if (shop.isActive === false) {
      throw new AppError(httpStatus.BAD_REQUEST, "This shop is inactive");
    }
    if (!payload.items?.length) {
      throw new AppError(httpStatus.BAD_REQUEST, "Order must have at least one item");
    }

    // Fetch & validate every product up-front (existence, pricing, stock availability).
    const productIds = payload.items.map((i) => i.product);
    const products = await ProductModel.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const items: IOrderItem[] = payload.items.map((item) => {
      const product = productMap.get(item.product);
      if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, `Product ${item.product} not found`);
      }
      if (product.isActive === false) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Product "${product.name}" is inactive`
        );
      }

      const totalPieces = toPieces(item.quantity, item.unit, product.piecesPerBox);

      if (totalPieces > product.stockInPieces) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for "${product.name}". Available: ${product.stockInPieces} pcs, requested: ${totalPieces} pcs`
        );
      }

      const subtotalCost = totalPieces * product.costPricePerPiece;
      const subtotalAmount = totalPieces * product.sellingPricePerPiece;

      return {
        product: product._id as Types.ObjectId,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        unit: item.unit,
        piecesPerBoxSnapshot: product.piecesPerBox,
        totalPieces,
        unitCostPrice: product.costPricePerPiece,
        unitSellingPrice: product.sellingPricePerPiece,
        subtotalCost,
        subtotalAmount,
        profit: subtotalAmount - subtotalCost,
      };
    });

    const totalAmount = items.reduce((sum, i) => sum + i.subtotalAmount, 0);
    const totalCost = items.reduce((sum, i) => sum + i.subtotalCost, 0);
    const totalProfit = totalAmount - totalCost;

    const orderPayload = {
      shop: shop._id,
      items,
      totalAmount,
      totalCost,
      totalProfit,
      status: OrderStatus.PENDING,
      orderDate: payload.orderDate ? new Date(payload.orderDate) : new Date(),
      notes: payload.notes,
      createdBy: userId,
    };

    // Try to run stock deduction + order creation atomically. Falls back to a
    // best-effort sequential run on standalone MongoDB instances that don't
    // support multi-document transactions (no replica set configured).
    try {
      return await this._executeWithTransaction(orderPayload, items, userId);
    } catch (err) {
      if (err instanceof AppError) throw err;
      const message = (err as Error)?.message || "";
      if (message.toLowerCase().includes("replica set") || message.toLowerCase().includes("transaction")) {
        return this._executeSequentially(orderPayload, items, userId);
      }
      throw err;
    }
  }

  private async _executeWithTransaction(
    orderPayload: Record<string, unknown>,
    items: IOrderItem[],
    userId: Types.ObjectId
  ) {
    const session = await mongoose.startSession();
    try {
      let createdOrder;
      await session.withTransaction(async () => {
        const [order] = await OrderModel.create([orderPayload], { session });
        createdOrder = order;

        for (const item of items) {
          await stockService.recordMovement({
            productId: item.product,
            type: StockMovementType.ORDER_OUT,
            signedQuantityPieces: -item.totalPieces,
            note: `Order ${order._id}`,
            orderId: order._id,
            performedBy: userId,
            session,
          });
        }
      });
      return createdOrder;
    } finally {
      await session.endSession();
    }
  }

  private async _executeSequentially(
    orderPayload: Record<string, unknown>,
    items: IOrderItem[],
    userId: Types.ObjectId
  ) {
    const order = await OrderModel.create(orderPayload);
    for (const item of items) {
      await stockService.recordMovement({
        productId: item.product,
        type: StockMovementType.ORDER_OUT,
        signedQuantityPieces: -item.totalPieces,
        note: `Order ${order._id}`,
        orderId: order._id,
        performedBy: userId,
      });
    }
    return order;
  }

  async getAllOrders(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.shop) filter.shop = query.shop;
    if (query.status) filter.status = query.status;

    if (query.startDate || query.endDate) {
      const { startDate, endDate } = resolveDateRange(
        query.startDate as string | undefined,
        query.endDate as string | undefined
      );
      filter.orderDate = { $gte: startDate, $lte: endDate };
    }

    const [data, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("shop", "shopName ownerName contactInfo")
        .populate("createdBy", "name email"),
      OrderModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderById(id: string) {
    const order = await OrderModel.findById(id)
      .populate("shop", "shopName ownerName contactInfo")
      .populate("createdBy", "name email");
    if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    return order;
  }

  async updateStatus(
    id: string,
    newStatus: OrderStatus,
    userId: Types.ObjectId,
    note?: string
  ) {
    const order = await OrderModel.findById(id);
    if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");

    const allowed = ALLOWED_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot change order status from "${order.status}" to "${newStatus}"`
      );
    }

    const shouldRestock =
      RESTOCKING_STATUSES.includes(newStatus) &&
      !RESTOCKING_STATUSES.includes(order.status);

    // Guard: don't silently orphan a payment. If the shop has already paid
    // something against this order, cancelling/returning it needs the paid
    // amount handled (refund or transfer) first via the payments module.
    if (shouldRestock && order.paidAmount > 0) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This order has ${order.paidAmount} already paid. Resolve/refund the payment before marking it as "${newStatus}".`
      );
    }

    if (shouldRestock) {
      for (const item of order.items) {
        await stockService.recordMovement({
          productId: item.product,
          type: StockMovementType.ORDER_RETURN,
          signedQuantityPieces: item.totalPieces,
          note: note || `Order ${order._id} ${newStatus}`,
          orderId: order._id,
          performedBy: userId,
          preventNegative: false,
        });
      }
    }

    order.status = newStatus;
    await order.save();
    return order;
  }

  async isOrderSaleStatus(status: OrderStatus) {
    return !NON_SALE_STATUSES.includes(status);
  }
}

export const orderService = new OrderService();
