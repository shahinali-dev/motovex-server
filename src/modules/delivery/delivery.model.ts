import { model, Schema } from "mongoose";
import { DeliveryStatus } from "./delivery.enum";
import { IDelivery } from "./delivery.interface";

const deliverySchema = new Schema<IDelivery>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    shop: { type: Schema.Types.ObjectId, ref: "Shop", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
    },
    scheduledDate: { type: Date },
    deliveredAt: { type: Date, default: null },
    address: { type: String, trim: true },
    notes: { type: String, trim: true },
    deliveryCost: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

deliverySchema.index({ order: 1 });
deliverySchema.index({ assignedTo: 1, status: 1 });
deliverySchema.index({ status: 1, scheduledDate: -1 });

const DeliveryModel = model<IDelivery>("Delivery", deliverySchema);

export default DeliveryModel;
