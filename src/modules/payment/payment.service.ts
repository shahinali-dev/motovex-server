import httpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination, resolveDateRange } from "../../utils/query_helpers.utils";
import { OrderStatus, PaymentStatus, derivePaymentStatus } from "../order/order.enum";
import OrderModel from "../order/order.model";
import { IRecordPaymentInput } from "./payment.interface";
import PaymentModel from "./payment.model";

// Orders in these statuses are not eligible for new payments.
const NON_PAYABLE_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED];

export class PaymentService {
  async recordPayment(
    orderId: string,
    payload: IRecordPaymentInput,
    userId: Types.ObjectId
  ) {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");

    if (NON_PAYABLE_STATUSES.includes(order.status)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot record a payment for an order that is "${order.status}"`
      );
    }

    const currentDue = order.totalAmount - order.paidAmount;
    if (payload.amount > currentDue) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Payment amount (${payload.amount}) exceeds the due amount (${currentDue})`
      );
    }

    const newPaidAmount = order.paidAmount + payload.amount;
    const newDueAmount = order.totalAmount - newPaidAmount;
    const newPaymentStatus = derivePaymentStatus(order.totalAmount, newPaidAmount);

    const run = async (session?: mongoose.ClientSession) => {
      const [payment] = await PaymentModel.create(
        [
          {
            order: order._id,
            shop: order.shop,
            amount: payload.amount,
            method: payload.method,
            note: payload.note,
            paidAmountAfter: newPaidAmount,
            dueAmountAfter: newDueAmount,
            receivedBy: userId,
            paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
          },
        ],
        session ? { session } : {}
      );

      order.paidAmount = newPaidAmount;
      order.paymentStatus = newPaymentStatus;
      await order.save(session ? { session } : {});

      return { payment, order };
    };

    try {
      const session = await mongoose.startSession();
      try {
        let result: { payment: unknown; order: unknown } | undefined;
        await session.withTransaction(async () => {
          result = await run(session);
        });
        return result!;
      } finally {
        await session.endSession();
      }
    } catch (err) {
      const message = (err as Error)?.message?.toLowerCase() || "";
      if (message.includes("replica set") || message.includes("transaction")) {
        return run();
      }
      throw err;
    }
  }

  async getPaymentsForOrder(orderId: string, query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);

    const [data, total] = await Promise.all([
      PaymentModel.find({ order: orderId })
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("receivedBy", "name email"),
      PaymentModel.countDocuments({ order: orderId }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Every individual order that currently has an outstanding due amount. */
  async getDueOrders(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {
      paymentStatus: { $in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
      status: { $nin: NON_PAYABLE_STATUSES },
    };
    if (query.shop) filter.shop = query.shop;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;

    const [data, total] = await Promise.all([
      OrderModel.find(filter)
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate("shop", "shopName ownerName contactInfo"),
      OrderModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** "Due shop list" - every shop with an outstanding balance, most-due first. */
  async getDueShops(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);

    const pipeline = [
      {
        $match: {
          paymentStatus: { $in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
          status: { $nin: NON_PAYABLE_STATUSES },
        },
      },
      {
        $group: {
          _id: "$shop",
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          dueOrderCount: { $sum: 1 },
        },
      },
      { $match: { totalDue: { $gt: 0 } } },
      { $sort: { totalDue: -1 as const } },
      {
        $lookup: {
          from: "shops",
          localField: "_id",
          foreignField: "_id",
          as: "shop",
        },
      },
      { $unwind: "$shop" },
      {
        $project: {
          _id: 0,
          shop: "$_id",
          shopName: "$shop.shopName",
          ownerName: "$shop.ownerName",
          contactInfo: "$shop.contactInfo",
          totalDue: 1,
          totalBilled: 1,
          totalPaid: 1,
          dueOrderCount: 1,
        },
      },
    ];

    const [data, countResult] = await Promise.all([
      OrderModel.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      OrderModel.aggregate([...pipeline, { $count: "total" }]),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Due detail (+ order list) for a single shop. */
  async getShopDueDetail(shopId: string) {
    const filter = {
      shop: new Types.ObjectId(shopId),
      paymentStatus: { $in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
      status: { $nin: NON_PAYABLE_STATUSES },
    };

    const [summary] = await OrderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          dueOrderCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const dueOrders = await OrderModel.find(filter).sort({ orderDate: -1 });

    return {
      summary: summary || {
        totalDue: 0,
        totalBilled: 0,
        totalPaid: 0,
        dueOrderCount: 0,
      },
      dueOrders,
    };
  }

  /** Dealership-wide due & collection summary, for a dashboard widget. */
  async getDueSummary(query: Record<string, unknown>) {
    const [outstanding] = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: { $in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] },
          status: { $nin: NON_PAYABLE_STATUSES },
        },
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          totalBilled: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          dueOrderCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const { startDate, endDate } = resolveDateRange(
      query.startDate as string | undefined,
      query.endDate as string | undefined
    );

    const [collection] = await PaymentModel.aggregate([
      { $match: { paymentDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    return {
      outstanding: outstanding || {
        totalDue: 0,
        totalBilled: 0,
        totalPaid: 0,
        dueOrderCount: 0,
      },
      collectionInRange: {
        range: { startDate, endDate },
        totalCollected: collection?.totalCollected || 0,
        paymentCount: collection?.paymentCount || 0,
      },
    };
  }
  /**
   * SR/DSR/DM-wise collection report — how much due each field-force user
   * has collected in a date range, grouped by who received the payment
   * (`Payment.receivedBy`). Useful for daily/weekly SR/DSR performance review.
   */
  async getCollectionsByCollector(query: Record<string, unknown>) {
    const { startDate, endDate } = resolveDateRange(
      query.startDate as string | undefined,
      query.endDate as string | undefined
    );

    const filter: Record<string, unknown> = {
      paymentDate: { $gte: startDate, $lte: endDate },
    };
    if (query.receivedBy) filter.receivedBy = new Types.ObjectId(String(query.receivedBy));

    const results = await PaymentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$receivedBy",
          totalCollected: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { totalCollected: -1 as const } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          collectedBy: "$_id",
          name: "$user.name",
          role: "$user.role",
          territory: "$user.territory",
          totalCollected: 1,
          paymentCount: 1,
        },
      },
    ]);

    return { range: { startDate, endDate }, data: results };
  }
}

export const paymentService = new PaymentService();
