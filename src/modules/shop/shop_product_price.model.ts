import { model, Schema, Types } from "mongoose";

/**
 * One row per (shop, product) pair holding the *last* rate that shop was
 * actually charged for that product, updated every time an order is
 * created. Lets the order screen show "last time you gave this shop ৳495"
 * even though the product's default sellingPricePerPiece is ৳500.
 */
export interface IShopProductPrice {
  shop: Types.ObjectId;
  product: Types.ObjectId;
  lastUnitSellingPrice: number;
  lastOrder: Types.ObjectId;
  lastOrderDate: Date;
}

const shopProductPriceSchema = new Schema<IShopProductPrice>(
  {
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    lastUnitSellingPrice: { type: Number, required: true },
    lastOrder: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    lastOrderDate: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

shopProductPriceSchema.index({ shop: 1, product: 1 }, { unique: true });

const ShopProductPriceModel = model<IShopProductPrice>(
  "ShopProductPrice",
  shopProductPriceSchema
);

export default ShopProductPriceModel;
