import httpStatus from "http-status";
import { AppError } from "../../errors/app_error";
import { getPagination } from "../../utils/query_helpers.utils";
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

    const [data, total] = await Promise.all([
      SupplierModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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
}

export const supplierService = new SupplierService();
