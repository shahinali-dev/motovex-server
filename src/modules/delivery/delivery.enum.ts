/* eslint-disable no-unused-vars */
export enum DeliveryStatus {
  PENDING = "pending", // created, not yet dispatched
  OUT_FOR_DELIVERY = "out_for_delivery", // handed to SR/DSR/DM for delivery
  DELIVERED = "delivered", // successfully delivered to the shop
  FAILED = "failed", // delivery attempt failed (redo or return to warehouse)
}
