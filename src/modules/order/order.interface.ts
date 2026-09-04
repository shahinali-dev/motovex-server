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
  unitSellingPrice: number; // selling price per single piece, snapshot at order time
  subtotalCost: number;
  subtotalAmount: number;
  profit: number;
}

export interface IOrderItemInput {
  product: string;
  quantity: number;
  unit: QuantityUnit;
}

export interface IOrder {
  _id?: Types.ObjectId;
  shop: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  status: OrderStatus;

  // Due/payment tracking. dueAmount is a virtual (totalAmount - paidAmount).
  paidAmount: number;
  paymentStatus: PaymentStatus;

  orderDate: Date;
  notes?: string;
  createdBy: Types.ObjectId;
}
