import { Types } from "mongoose";
import { PaymentMethod } from "./payment.enum";

export interface IPayment {
  _id?: Types.ObjectId;
  order: Types.ObjectId;
  shop: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  note?: string;
  // Snapshot of the order's paidAmount/dueAmount right after this payment,
  // handy for showing a running history without recomputation.
  paidAmountAfter: number;
  dueAmountAfter: number;
  receivedBy: Types.ObjectId;
  paymentDate: Date;
}

export interface IRecordPaymentInput {
  amount: number;
  method: PaymentMethod;
  note?: string;
  paymentDate?: string;
}
