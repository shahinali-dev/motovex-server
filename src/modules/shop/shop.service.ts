import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
import { IShop } from "./shop.interface";
import ShopModel from "./shop.model";

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
}

export const shopService = new ShopService();
