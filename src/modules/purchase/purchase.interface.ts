import { Types } from "mongoose";
import { QuantityUnit } from "../../utils/stock_unit.utils";
import { PurchasePaymentStatus, PurchaseStatus } from "./purchase.enum";

export interface IPurchaseItem {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number; // in the unit below, as entered by the user
  unit: QuantityUnit;
  piecesPerBoxSnapshot: number;
  totalPieces: number; // converted base-unit quantity, used for stock addition
  unitCostPrice: number; // raw cost price per piece, as billed by the supplier (before khoroch)
  subtotalCost: number; // raw, pre-khoroch — this is what's owed to the supplier

  // "Khoroch" (extra purchase cost — transport, import duty, etc.) is
  // entered once per purchase and spread across every piece in that
  // purchase. These two fields are the per-item result of that split:
  // landedUnitCostPrice === unitCostPrice whenever no khoroch was added.
  landedUnitCostPrice: number; // unitCostPrice + this item's share of extraCost per piece
  landedSubtotalCost: number; // totalPieces * landedUnitCostPrice
}

export interface IPurchaseItemInput {
  product: string;
  quantity: number;
  unit: QuantityUnit;
  unitCostPrice?: number; // override product's current cost price for this purchase
  updateProductCostPrice?: boolean; // default true — refresh product's cost price from this purchase
}

export interface IPurchasePaymentRecord {
  amount: number;
  note?: string;
  attachmentUrl?: string; // bank-transfer receipt / supplier invoice, if uploaded
  paidBy: Types.ObjectId;
  paidAt: Date;
}

export interface IPurchase {
  _id?: Types.ObjectId;
  supplier: Types.ObjectId;
  invoiceNumber?: string;
  items: IPurchaseItem[];
  totalAmount: number; // sum of raw subtotalCost — what's owed to the supplier

  // Total "khoroch" (extra cost — carrying/import/transport etc.) for this
  // purchase, entered once and distributed per-piece across all items.
  // This is the shop's own operating cost, not part of what's owed to the
  // supplier, so it's tracked separately from totalAmount.
  extraCost: number;

  status: PurchaseStatus;

  paidAmount: number;
  paymentStatus: PurchasePaymentStatus;
  paymentHistory: IPurchasePaymentRecord[];

  purchaseDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}
