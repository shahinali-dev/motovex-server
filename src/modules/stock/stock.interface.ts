import { Types } from "mongoose";
import { StockMovementType } from "./stock.enum";

export interface IStockLog {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  type: StockMovementType;
  // Signed value in pieces: positive = added to stock, negative = removed from stock.
  quantityPieces: number;
  stockAfterPieces: number;
  note?: string;
  order?: Types.ObjectId;
  performedBy?: Types.ObjectId;
}
