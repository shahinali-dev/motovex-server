/* eslint-disable no-unused-vars */
export enum Role {
  ADMIN = "admin", // Full access: manage users, shops, products, view all reports
  MANAGER = "manager", // Manage products/inventory/shops/orders, view reports
  STAFF = "staff", // Create orders, view products/shops, no report/admin access
}
