import { model, Schema } from "mongoose";
import { PaymentMethod } from "./payment.enum";
import { IPayment } from "./payment.interface";

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    note: { type: String, trim: true },
    paidAmountAfter: { type: Number, required: true },
    dueAmountAfter: { type: Number, required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ order: 1, paymentDate: -1 });
paymentSchema.index({ shop: 1, paymentDate: -1 });

const PaymentModel = model<IPayment>("Payment", paymentSchema);

export default PaymentModel;
