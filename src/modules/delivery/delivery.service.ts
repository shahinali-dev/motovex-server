import httpStatus from "http-status";
import { Types } from "mongoose";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import OrderModel from "../order/order.model";
import { OrderStatus } from "../order/order.enum";
import { orderService } from "../order/order.service";
import ShopModel, { formatShopAddress } from "../shop/shop.model";
import UserModel from "../user/user.model";
import { FIELD_FORCE_ROLES, Role } from "../user/user.enum";
import { DeliveryStatus } from "./delivery.enum";
import { IDelivery } from "./delivery.interface";
import DeliveryModel from "./delivery.model";

interface ICreateDeliveryPayload {
  order: string;
  assignedTo?: string;
  scheduledDate?: string;
  address?: string;
  notes?: string;
  deliveryCost?: number;
}

const ALLOWED_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.FAILED]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.PENDING,
  ],
};

export class DeliveryService {
  private async assertFieldForceUser(userId?: string) {
    if (!userId) return;
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError(httpStatus.NOT_FOUND, "Assigned user not found");
    const allowedRoles = [...FIELD_FORCE_ROLES, Role.ADMIN, Role.MANAGER];
    if (!allowedRoles.includes(user.role)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Deliveries can only be assigned to an SR, DSR, DM, admin, or manager"
      );
    }
  }

  async createDelivery(
    payload: ICreateDeliveryPayload,
    userId: Types.ObjectId
  ) {
    const order = await OrderModel.findById(payload.order);
    if (!order) throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PROCESSING
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot create a delivery for an order with status "${order.status}"`
      );
    }

    const existing = await DeliveryModel.findOne({
      order: order._id,
      status: { $ne: DeliveryStatus.FAILED },
    });
    if (existing) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "An active delivery already exists for this order"
      );
    }

    await this.assertFieldForceUser(payload.assignedTo);

    // Auto-fill the delivery address from the shop's saved
    // Bazar/Thana/Zila unless the dashboard explicitly overrides it.
    const shopDoc = await ShopModel.findById(order.shop);
    const address =
      payload.address || (shopDoc ? formatShopAddress(shopDoc.address) : undefined);

    const delivery = await DeliveryModel.create({
      order: order._id,
      shop: order.shop,
      assignedTo: payload.assignedTo || null,
      scheduledDate: payload.scheduledDate
        ? new Date(payload.scheduledDate)
        : undefined,
      address,
      notes: payload.notes,
      deliveryCost: payload.deliveryCost || 0,
      createdBy: userId,
    });

    return delivery;
  }

  /** Set/update the actual cost of running this delivery (fuel, rider fee, etc). */
  async updateDeliveryCost(id: string, deliveryCost: number) {
    const delivery = await DeliveryModel.findByIdAndUpdate(
      id,
      { deliveryCost },
      { new: true, runValidators: true }
    );
    if (!delivery)
      throw new AppError(httpStatus.NOT_FOUND, "Delivery not found");
    return delivery;
  }

  async getAllDeliveries(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (query.shop) filter.shop = query.shop;

    const [data, total] = await Promise.all([
      DeliveryModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("order", "totalAmount status")
        .populate("shop", "shopName ownerName contactInfo")
        .populate("assignedTo", "name role phone territory"),
      DeliveryModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getDeliveryById(id: string) {
    const delivery = await DeliveryModel.findById(id)
      .populate("order")
      .populate("shop", "shopName ownerName contactInfo")
      .populate("assignedTo", "name role phone territory");
    if (!delivery)
      throw new AppError(httpStatus.NOT_FOUND, "Delivery not found");
    return delivery;
  }

  async assignDelivery(id: string, assignedTo: string) {
    await this.assertFieldForceUser(assignedTo);
    const delivery = await DeliveryModel.findByIdAndUpdate(
      id,
      { assignedTo },
      { new: true, runValidators: true }
    );
    if (!delivery)
      throw new AppError(httpStatus.NOT_FOUND, "Delivery not found");
    return delivery;
  }

  async updateStatus(
    id: string,
    newStatus: DeliveryStatus,
    userId: Types.ObjectId,
    note?: string
  ) {
    const delivery = await DeliveryModel.findById(id);
    if (!delivery)
      throw new AppError(httpStatus.NOT_FOUND, "Delivery not found");

    const allowed = ALLOWED_TRANSITIONS[delivery.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Cannot change delivery status from "${delivery.status}" to "${newStatus}"`
      );
    }

    if (newStatus === DeliveryStatus.DELIVERED) {
      // Keep the Order in sync: a delivered shipment marks the order delivered too.
      const order = await OrderModel.findById(delivery.order);
      if (order && order.status === OrderStatus.PROCESSING) {
        await orderService.updateStatus(
          String(order._id),
          OrderStatus.DELIVERED,
          userId,
          note
        );
      }
      delivery.deliveredAt = new Date();
    }

    delivery.status = newStatus;
    if (note) delivery.notes = [delivery.notes, note].filter(Boolean).join(" | ");
    await delivery.save();
    return delivery;
  }
}

export const deliveryService = new DeliveryService();
