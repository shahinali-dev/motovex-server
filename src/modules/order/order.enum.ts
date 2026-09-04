/* eslint-disable no-unused-vars */
export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  RETURNED = "returned",
}

// Orders in these statuses should NOT be counted as real sales in reports.
export const NON_SALE_STATUSES = [OrderStatus.CANCELLED];

/* eslint-disable no-unused-vars */
export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
}

export const derivePaymentStatus = (
  totalAmount: number,
  paidAmount: number
): PaymentStatus => {
  if (paidAmount <= 0) return PaymentStatus.UNPAID;
  if (paidAmount >= totalAmount) return PaymentStatus.PAID;
  return PaymentStatus.PARTIAL;
};
