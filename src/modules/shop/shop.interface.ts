import { Types } from "mongoose";

export interface IShopContactInfo {
  phone: string;
  email?: string;
  address?: string;
}

export interface IShop {
  _id?: Types.ObjectId;
  shopName: string;
  ownerName: string;
  contactInfo: IShopContactInfo;
  note?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
}
