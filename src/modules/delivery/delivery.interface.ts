import { Types } from "mongoose";
import { DeliveryStatus } from "./delivery.enum";

export interface IDelivery {
  _id?: Types.ObjectId;
  order: Types.ObjectId;
  shop: Types.ObjectId;
  assignedTo?: Types.ObjectId | null; // SR / DSR / DM handling the delivery
  status: DeliveryStatus;
  scheduledDate?: Date;
  deliveredAt?: Date | null;
  address?: string;
  notes?: string;
  // Cost of actually running this delivery (fuel, rider fee, etc.) — counted
  // into "today's khoroch" on the overview dashboard alongside purchase
  // extraCost. Defaults to 0 and can be filled in/edited any time.
  deliveryCost?: number;
  createdBy: Types.ObjectId;
}
