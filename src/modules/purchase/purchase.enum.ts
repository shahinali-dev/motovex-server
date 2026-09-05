/* eslint-disable no-unused-vars */
export enum PurchaseStatus {
  PENDING = "pending", // raised, stock not yet received
  RECEIVED = "received", // goods received into warehouse — adds stock
  CANCELLED = "cancelled", // cancelled before receiving — no stock effect
  RETURNED = "returned", // returned to supplier after receiving — removes stock
}

export enum PurchasePaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
}

export const derivePurchasePaymentStatus = (
  totalAmount: number,
  paidAmount: number
): PurchasePaymentStatus => {
  if (paidAmount <= 0) return PurchasePaymentStatus.UNPAID;
  if (paidAmount >= totalAmount) return PurchasePaymentStatus.PAID;
  return PurchasePaymentStatus.PARTIAL;
};
