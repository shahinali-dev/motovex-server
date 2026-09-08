import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
import { categoryRoute } from "../modules/category/category.controller";
import { deliveryRoute } from "../modules/delivery/delivery.controller";
import { orderRoute } from "../modules/order/order.controller";
import { paymentRoute } from "../modules/payment/payment.controller";
import { productRoute } from "../modules/product/product.controller";
import { purchaseRoute } from "../modules/purchase/purchase.controller";
import { reportRoute } from "../modules/report/report.controller";
import { shopRoute } from "../modules/shop/shop.controller";
import { stockRoute } from "../modules/stock/stock.controller";
import { supplierRoute } from "../modules/supplier/supplier.controller";
import { userRoute } from "../modules/user/user.controller";

const router = Router();

const moduleRoutes = [
  { path: "/api/v1/auth", route: authRoute },
  { path: "/api/v1/users", route: userRoute },
  { path: "/api/v1/shops", route: shopRoute },
  // "Customers" is the same entity as "Shop" in this dealership domain
  // (the retail shops Motovex sells to) — mounted twice so either name
  // works for API consumers without duplicating any logic.
  { path: "/api/v1/customers", route: shopRoute },
  { path: "/api/v1/suppliers", route: supplierRoute },
  { path: "/api/v1/categories", route: categoryRoute },
  { path: "/api/v1/products", route: productRoute },
  { path: "/api/v1/stock", route: stockRoute },
  { path: "/api/v1/purchases", route: purchaseRoute },
  { path: "/api/v1/orders", route: orderRoute },
  { path: "/api/v1/deliveries", route: deliveryRoute },
  { path: "/api/v1/payments", route: paymentRoute },
  { path: "/api/v1/reports", route: reportRoute },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
