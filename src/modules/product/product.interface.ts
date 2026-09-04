import { Types } from "mongoose";

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  sku: string;
  category?: string;
  brand?: string;
  description?: string;

  // 1 Box = piecesPerBox Pieces. All stock is stored internally in pieces.
  piecesPerBox: number;

  // Prices are always stored per single piece; box price = costPricePerPiece * piecesPerBox
  // unless boxSellingPrice/boxCostPrice are explicitly set (e.g. bulk discount).
  costPricePerPiece: number;
  sellingPricePerPiece: number;
  boxCostPrice?: number;
  boxSellingPrice?: number;

  stockInPieces: number;
  lowStockThresholdPieces: number;

  isActive?: boolean;
  createdBy?: Types.ObjectId;
}
