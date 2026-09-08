import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { getPagination, resolvePeriodRange } from "../../utils/query_helpers.utils";
import { orderService } from "../order/order.service";
import { IShop } from "./shop.interface";
import ShopModel from "./shop.model";
import ShopProductPriceModel from "./shop_product_price.model";

export class ShopService {
  async createShop(payload: IShop) {
    return ShopModel.create(payload);
  }

  async getAllShops(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    if (query.search) {
      filter.$or = [
        { shopName: { $regex: query.search, $options: "i" } },
        { ownerName: { $regex: query.search, $options: "i" } },
        { "contactInfo.phone": { $regex: query.search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      ShopModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ShopModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getShopById(id: string) {
    const shop = await ShopModel.findById(id);
    if (!shop) throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    return shop;
  }

  async updateShop(id: string, payload: Partial<IShop>) {
    const shop = await ShopModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!shop) throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    return shop;
  }

  async deleteShop(id: string) {
    const shop = await ShopModel.findByIdAndDelete(id);
    if (!shop) throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    return shop;
  }

  /**
   * Every product this shop has ever been given a rate for, and the last
   * rate/date — powers the "last time you gave this shop ৳X for this
   * product" hint on the order-creation screen.
   */
  async getLastRates(shopId: string) {
    await this.getShopById(shopId); // 404s if the shop doesn't exist

    const rates = await ShopProductPriceModel.find({ shop: shopId })
      .sort({ lastOrderDate: -1 })
      .populate("product", "name sku sellingPricePerPiece");

    return rates;
  }

  /**
   * This shop's order history with the standard preset filters (date/week/
   * month/3month/6month/1year/lifetime) — shown on the shop detail page.
   */
  async getOrderHistory(shopId: string, query: Record<string, unknown>) {
    await this.getShopById(shopId);

    const { startDate, endDate } = resolvePeriodRange(
      query.period as string | undefined
    );

    return orderService.getAllOrders({
      ...query,
      shop: shopId,
      ...(startDate && endDate
        ? {
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
          }
        : {}),
    });
  }

  /**
   * Records/updates the last rate a shop was charged for a product.
   * Called from OrderService right after an order is created.
   */
  async recordLastRate(
    shopId: unknown,
    productId: unknown,
    unitSellingPrice: number,
    orderId: unknown
  ) {
    await ShopProductPriceModel.findOneAndUpdate(
      { shop: shopId, product: productId },
      {
        lastUnitSellingPrice: unitSellingPrice,
        lastOrder: orderId,
        lastOrderDate: new Date(),
      },
      { upsert: true, new: true }
    );
  }
}

export const shopService = new ShopService();
