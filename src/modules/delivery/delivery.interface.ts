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
  createdBy: Types.ObjectId;
}
