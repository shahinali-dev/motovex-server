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
  unitCostPrice: number; // cost price per single piece paid on this purchase
  subtotalCost: number;
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
  totalAmount: number;
  status: PurchaseStatus;

  paidAmount: number;
  paymentStatus: PurchasePaymentStatus;
  paymentHistory: IPurchasePaymentRecord[];

  purchaseDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}
