import { model, Schema } from "mongoose";
import { PurchasePaymentStatus, PurchaseStatus } from "./purchase.enum";
import {
  IPurchase,
  IPurchaseItem,
  IPurchasePaymentRecord,
} from "./purchase.interface";

const purchaseItemSchema = new Schema<IPurchaseItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, enum: ["box", "pieces"], required: true },
    piecesPerBoxSnapshot: { type: Number, required: true },
    totalPieces: { type: Number, required: true },
    unitCostPrice: { type: Number, required: true },
    subtotalCost: { type: Number, required: true },
    landedUnitCostPrice: { type: Number, required: true },
    landedSubtotalCost: { type: Number, required: true },
  },
  { _id: false }
);

const purchasePaymentRecordSchema = new Schema<IPurchasePaymentRecord>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    note: { type: String, trim: true },
    attachmentUrl: { type: String, trim: true },
    paidBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const purchaseSchema = new Schema<IPurchase>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    invoiceNumber: { type: String, trim: true },
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: (v: IPurchaseItem[]) => Array.isArray(v) && v.length > 0,
        message: "Purchase must have at least one item",
      },
    },
    totalAmount: { type: Number, required: true, default: 0 },
    // Purchase-level khoroch (extra cost) — see IPurchase for details.
    extraCost: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(PurchaseStatus),
      default: PurchaseStatus.PENDING,
    },

    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PurchasePaymentStatus),
      default: PurchasePaymentStatus.UNPAID,
    },
    paymentHistory: { type: [purchasePaymentRecordSchema], default: [] },

    purchaseDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

purchaseSchema.virtual("dueAmount").get(function (this: IPurchase) {
  return Math.max(this.totalAmount - this.paidAmount, 0);
});

// What this purchase actually cost the business once khoroch is folded in
// (supplier bill + extra cost) — used by daily "todays khoroch"/profit reports.
purchaseSchema.virtual("totalLandedCost").get(function (this: IPurchase) {
  return this.totalAmount + (this.extraCost || 0);
});

purchaseSchema.index({ supplier: 1, purchaseDate: -1 });
purchaseSchema.index({ status: 1, purchaseDate: -1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ paymentStatus: 1 });

const PurchaseModel = model<IPurchase>("Purchase", purchaseSchema);

export default PurchaseModel;
