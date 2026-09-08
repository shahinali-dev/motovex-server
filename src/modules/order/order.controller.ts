import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { orderService } from "./order.service";
import { orderValidation } from "./order.validation";

const router = Router();

// Staff can create orders too (that's the whole point of a dealership order desk).
router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF),
  validateRequest(orderValidation.createOrderValidationSchema),
  catchAsync(async (req, res) => {
    const order = await orderService.createOrder(req.body, req.user!._id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Order created successfully",
      data: order,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await orderService.getAllOrders(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Orders fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const order = await orderService.getOrderById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order fetched successfully",
      data: order,
    });
  })
);

router.patch(
  "/:id/status",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF),
  validateRequest(orderValidation.updateOrderStatusValidationSchema),
  catchAsync(async (req, res) => {
    const order = await orderService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!._id,
      req.body.note
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order status updated successfully",
      data: order,
    });
  })
);

// Adjust how much of one line item this order actually holds — e.g. shop
// ordered 10 pcs, only took 5 at delivery. Reconciles stock automatically.
router.patch(
  "/:id/items/:productId",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.DM),
  validateRequest(orderValidation.adjustOrderItemValidationSchema),
  catchAsync(async (req, res) => {
    const order = await orderService.adjustItemQuantity(
      req.params.id,
      req.params.productId,
      req.body.quantity,
      req.body.unit,
      req.user!._id,
      req.body.note
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Order item quantity updated successfully",
      data: order,
    });
  })
);

export const orderRoute = router;
