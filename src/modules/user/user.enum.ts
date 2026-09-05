/* eslint-disable no-unused-vars */
export enum Role {
  ADMIN = "admin", // Full access: manage users, shops, products, view all reports
  MANAGER = "manager", // Manage products/inventory/shops/orders, view reports
  STAFF = "staff", // Create orders, view products/shops, no report/admin access
  DM = "dm", // Distribution Manager — oversees a territory, its DSRs/SRs and their targets
  DSR = "dsr", // Distributor Sales Representative — takes orders/collects due in the field
  SR = "sr", // Sales Representative — books orders / assists deliveries in a territory
}

// Field-force roles that can be assigned deliveries, order-booking and
// due-collection responsibility. Kept separate from back-office roles
// (admin/manager/staff) so reports can be sliced "SR/DSR/DM-wise".
export const FIELD_FORCE_ROLES = [Role.DM, Role.DSR, Role.SR];
