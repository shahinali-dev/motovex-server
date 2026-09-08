import { Types } from "mongoose";
import { QuantityUnit } from "../../utils/stock_unit.utils";
import { OrderStatus, PaymentStatus } from "./order.enum";

export interface IOrderItem {
  product: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number; // in the unit below, as entered by the user
  unit: QuantityUnit;
  piecesPerBoxSnapshot: number;
  totalPieces: number; // converted base-unit quantity, used for stock deduction
  unitCostPrice: number; // cost price per single piece, snapshot at order time
  unitSellingPrice: number; // selling price per single piece — the shop-specific rate actually charged
  subtotalCost: number;
  subtotalAmount: number;
  profit: number;

  // Set when this item was ordered beyond available stock. The order is
  // still created (and stock allowed to go negative for this item) but the
  // dashboard should surface a clear warning so the shortfall gets
  // purchased/restocked before delivery.
  isBackordered?: boolean;
  shortfallPieces?: number;
}

export interface IOrderItemInput {
  product: string;
  quantity: number;
  unit: QuantityUnit;
  // Optional per-shop override of the product's default selling price
  // (e.g. giving this particular shop ৳5 off). Falls back to the
  // product's sellingPricePerPiece when omitted.
  unitSellingPrice?: number;
}

export interface IOrder {
  _id?: Types.ObjectId;
  shop: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  status: OrderStatus;

  // True when at least one item was ordered beyond available stock (see
  // IOrderItem.isBackordered) — the dashboard should show a warning banner.
  hasStockWarning?: boolean;

  // Due/payment tracking. dueAmount is a virtual (totalAmount - paidAmount).
  paidAmount: number;
  paymentStatus: PaymentStatus;

  orderDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}
