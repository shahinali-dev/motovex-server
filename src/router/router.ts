import { Router } from "express";
import { authRoute } from "../modules/auth/auth.controller";
import { orderRoute } from "../modules/order/order.controller";
import { paymentRoute } from "../modules/payment/payment.controller";
import { productRoute } from "../modules/product/product.controller";
import { reportRoute } from "../modules/report/report.controller";
import { shopRoute } from "../modules/shop/shop.controller";
import { stockRoute } from "../modules/stock/stock.controller";
import { userRoute } from "../modules/user/user.controller";

const router = Router();

const moduleRoutes = [
  { path: "/api/v1/auth", route: authRoute },
  { path: "/api/v1/users", route: userRoute },
  { path: "/api/v1/shops", route: shopRoute },
  { path: "/api/v1/products", route: productRoute },
  { path: "/api/v1/stock", route: stockRoute },
  { path: "/api/v1/orders", route: orderRoute },
  { path: "/api/v1/payments", route: paymentRoute },
  { path: "/api/v1/reports", route: reportRoute },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
