import { Types } from "mongoose";

export interface IShopContactInfo {
  phone: string;
  email?: string;
}

// Bangladesh-style local address breakdown, as used everywhere else in the
// business (purchase/delivery paperwork, SR visit sheets etc.):
// Bazar (local market/area) -> Thana -> Zila (district).
export interface IShopAddress {
  bazar: string;
  thana: string;
  zila: string;
}

export interface IShop {
  _id?: Types.ObjectId;
  shopName: string;
  ownerName: string;
  contactInfo: IShopContactInfo;
  address: IShopAddress;
  note?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId;
}
