import { model, Schema } from "mongoose";
import { IShop, IShopAddress } from "./shop.interface";

const shopSchema = new Schema<IShop>(
  {
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    contactInfo: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    address: {
      bazar: { type: String, required: true, trim: true },
      thana: { type: String, required: true, trim: true },
      zila: { type: String, required: true, trim: true },
    },
    note: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ shopName: "text", ownerName: "text" });

// Single-line address string ("Bazar, Thana, Zila") — used to auto-fill a
// delivery's address whenever the dashboard doesn't override it manually.
export const formatShopAddress = (address: IShopAddress) =>
  [address.bazar, address.thana, address.zila].filter(Boolean).join(", ");

const ShopModel = model<IShop>("Shop", shopSchema);

export default ShopModel;
