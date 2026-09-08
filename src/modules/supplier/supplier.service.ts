import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { getPagination, resolvePeriodRange } from "../../utils/query_helpers.utils";
import { purchaseService } from "../purchase/purchase.service";
import { ISupplier } from "./supplier.interface";
import SupplierModel from "./supplier.model";

export class SupplierService {
  async createSupplier(payload: ISupplier) {
    return SupplierModel.create(payload);
  }

  async getAllSuppliers(query: Record<string, unknown>) {
    const { page, limit, skip } = getPagination(query);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === "true";
    }
    if (query.search) {
      filter.$or = [
        { supplierName: { $regex: query.search, $options: "i" } },
        { contactPerson: { $regex: query.search, $options: "i" } },
        { "contactInfo.phone": { $regex: query.search, $options: "i" } },
      ];
    }

    // Default to A-Z by supplier name; ?sort=-name or ?sort=recent for other orders.
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      name: { supplierName: 1 },
      "-name": { supplierName: -1 },
      recent: { createdAt: -1 },
    };
    const sort = sortMap[query.sort as string] || sortMap.name;

    const [data, total] = await Promise.all([
      SupplierModel.find(filter).sort(sort).skip(skip).limit(limit),
      SupplierModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSupplierById(id: string) {
    const supplier = await SupplierModel.findById(id);
    if (!supplier)
      throw new AppError(httpStatus.NOT_FOUND, "Supplier not found");
    return supplier;
  }

  async updateSupplier(id: string, payload: Partial<ISupplier>) {
    const supplier = await SupplierModel.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
    if (!supplier)
      throw new AppError(httpStatus.NOT_FOUND, "Supplier not found");
    return supplier;
  }

  async deleteSupplier(id: string) {
    const supplier = await SupplierModel.findByIdAndDelete(id);
    if (!supplier)
      throw new AppError(httpStatus.NOT_FOUND, "Supplier not found");
    return supplier;
  }

  /**
   * This supplier's purchase history with the standard preset filters
   * (date/week/month/3month/6month/1year/lifetime) — shown on the supplier
   * detail page, right next to a "new purchase" action for this supplier.
   */
  async getPurchaseHistory(supplierId: string, query: Record<string, unknown>) {
    await this.getSupplierById(supplierId); // 404s if the supplier doesn't exist

    const { startDate, endDate } = resolvePeriodRange(
      query.period as string | undefined
    );

    return purchaseService.getAllPurchases({
      ...query,
      supplier: supplierId,
      ...(startDate && endDate
        ? {
            startDate: startDate.toISOString().slice(0, 10),
            endDate: endDate.toISOString().slice(0, 10),
          }
        : {}),
    });
  }
}

export const supplierService = new SupplierService();
