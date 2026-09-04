import { model, Schema } from "mongoose";
import { IShop } from "./shop.interface";

const shopSchema = new Schema<IShop>(
  {
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    contactInfo: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      address: { type: String, trim: true },
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

const ShopModel = model<IShop>("Shop", shopSchema);

export default ShopModel;
