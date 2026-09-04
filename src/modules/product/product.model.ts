import { model, Schema } from "mongoose";
import { IProduct } from "./product.interface";

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, trim: true },
    brand: { type: String, trim: true },
    description: { type: String, trim: true },

    piecesPerBox: { type: Number, required: true, min: 1, default: 1 },

    costPricePerPiece: { type: Number, required: true, min: 0 },
    sellingPricePerPiece: { type: Number, required: true, min: 0 },
    boxCostPrice: { type: Number, min: 0 },
    boxSellingPrice: { type: Number, min: 0 },

    stockInPieces: { type: Number, required: true, default: 0, min: 0 },
    lowStockThresholdPieces: { type: Number, required: true, default: 20, min: 0 },

    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual("effectiveBoxCostPrice").get(function (this: IProduct) {
  return this.boxCostPrice ?? this.costPricePerPiece * this.piecesPerBox;
});

productSchema.virtual("effectiveBoxSellingPrice").get(function (this: IProduct) {
  return this.boxSellingPrice ?? this.sellingPricePerPiece * this.piecesPerBox;
});

productSchema.virtual("stockInBoxes").get(function (this: IProduct) {
  return Math.floor(this.stockInPieces / this.piecesPerBox);
});

productSchema.virtual("stockRemainderPieces").get(function (this: IProduct) {
  return this.stockInPieces % this.piecesPerBox;
});

productSchema.virtual("isLowStock").get(function (this: IProduct) {
  return this.stockInPieces <= this.lowStockThresholdPieces;
});

productSchema.index({ name: "text", sku: "text", brand: "text" });

const ProductModel = model<IProduct>("Product", productSchema);

export default ProductModel;
