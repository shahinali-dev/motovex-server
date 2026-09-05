/* eslint-disable no-unused-vars */
export enum StockMovementType {
  OPENING = "opening", // initial stock when product is created
  MANUAL_IN = "manual_in", // manual restock / purchase received
  MANUAL_OUT = "manual_out", // manual stock removal (damage, loss, etc.)
  ADJUSTMENT = "adjustment", // correction after a physical stock count
  ORDER_OUT = "order_out", // stock reserved/sold for an order
  ORDER_RETURN = "order_return", // stock returned to inventory (order cancelled/returned)
  PURCHASE_IN = "purchase_in", // stock received against a supplier purchase
  PURCHASE_RETURN = "purchase_return", // stock sent back to a supplier (purchase return)
}
