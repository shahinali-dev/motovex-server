import { model, Schema } from "mongoose";
import { OrderStatus, PaymentStatus } from "./order.enum";
import { IOrder, IOrderItem } from "./order.interface";

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: ["box", "pieces"], required: true },
    piecesPerBoxSnapshot: { type: Number, required: true },
    totalPieces: { type: Number, required: true },
    unitCostPrice: { type: Number, required: true },
    unitSellingPrice: { type: Number, required: true },
    subtotalCost: { type: Number, required: true },
    subtotalAmount: { type: Number, required: true },
    profit: { type: Number, required: true },
    isBackordered: { type: Boolean, default: false },
    shortfallPieces: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v: IOrderItem[]) => Array.isArray(v) && v.length > 0,
        message: "Order must have at least one item",
      },
    },
    totalAmount: { type: Number, required: true, default: 0 },
    totalCost: { type: Number, required: true, default: 0 },
    totalProfit: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    hasStockWarning: { type: Boolean, default: false },

    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
    },

    orderDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.virtual("dueAmount").get(function (this: IOrder) {
  return Math.max(this.totalAmount - this.paidAmount, 0);
});

orderSchema.index({ shop: 1, orderDate: -1 });
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });

const OrderModel = model<IOrder>("Order", orderSchema);

export default OrderModel;
