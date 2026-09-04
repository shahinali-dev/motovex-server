import { model, Schema } from "mongoose";
import { StockMovementType } from "./stock.enum";
import { IStockLog } from "./stock.interface";

const stockLogSchema = new Schema<IStockLog>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
      type: String,
      enum: Object.values(StockMovementType),
      required: true,
    },
    quantityPieces: { type: Number, required: true },
    stockAfterPieces: { type: Number, required: true },
    note: { type: String, trim: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

stockLogSchema.index({ product: 1, createdAt: -1 });

const StockLogModel = model<IStockLog>("StockLog", stockLogSchema);

export default StockLogModel;
