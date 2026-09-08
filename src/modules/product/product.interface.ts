import { Types } from "mongoose";

export interface IProduct {
  _id?: Types.ObjectId;
  name: string;
  sku: string;
  // Denormalized category name (kept in sync with categoryId) so search/
  // filtering/display never needs an extra populate — same pattern used
  // for productName/sku snapshots on purchase & order items.
  category?: string;
  categoryId?: Types.ObjectId;
  brand?: string;
  description?: string;

  // 1 Box = piecesPerBox Pieces. All stock is stored internally in pieces.
  piecesPerBox: number;

  // Prices are always stored per single piece; box price = costPricePerPiece * piecesPerBox
  // unless boxSellingPrice/boxCostPrice are explicitly set (e.g. bulk discount).
  // Effective cost per piece — reflects khoroch (purchase extra cost) when
  // any was added on the last received purchase; used everywhere margin/
  // stock-value is calculated.
  costPricePerPiece: number;
  // Raw, pre-khoroch rate the supplier actually billed on the last received
  // purchase — informational only, so the "before vs after khoroch" rates
  // can both be shown on the product.
  lastPurchaseRate?: number;
  sellingPricePerPiece: number;
  boxCostPrice?: number;
  boxSellingPrice?: number;

  stockInPieces: number;
  lowStockThresholdPieces: number;

  isActive?: boolean;
  createdBy?: Types.ObjectId;
}
