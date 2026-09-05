import { Types } from "mongoose";

export interface ISupplierContactInfo {
  phone: string;
  email?: string;
  address?: string;
}

export interface ISupplier {
  _id?: Types.ObjectId;
  supplierName: string;
  contactPerson?: string;
  contactInfo: ISupplierContactInfo;
  note?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
}
