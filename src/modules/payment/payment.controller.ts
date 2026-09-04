import { Router } from "express";
import httpStatus from "http-status";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { paymentService } from "./payment.service";
import { paymentValidation } from "./payment.validation";

const router = Router();

// Record a payment (full or partial) against an order.
// Send { amount: <dueAmount> } for a full settlement, or any smaller amount for partial.
router.post(
  "/orders/:orderId",
  isAuth,
  validateRequest(paymentValidation.recordPaymentValidationSchema),
  catchAsync(async (req, res) => {
    const result = await paymentService.recordPayment(
      req.params.orderId,
      req.body,
      req.user!._id
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Payment recorded successfully",
      data: result,
    });
  })
);

router.get(
  "/orders/:orderId",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await paymentService.getPaymentsForOrder(
      req.params.orderId,
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment history fetched successfully",
      data: result,
    });
  })
);

// Every order that currently has an outstanding due amount.
router.get(
  "/due-orders",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await paymentService.getDueOrders(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Due orders fetched successfully",
      data: result,
    });
  })
);

// The "due shop list" - every shop with an outstanding balance, most-due first.
router.get(
  "/due-shops",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await paymentService.getDueShops(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Due shop list fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/due-shops/:shopId",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await paymentService.getShopDueDetail(req.params.shopId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop due detail fetched successfully",
      data: result,
    });
  })
);

// Dashboard summary: total outstanding due + amount collected in a date range.
router.get(
  "/summary",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await paymentService.getDueSummary(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Due & collection summary fetched successfully",
      data: result,
    });
  })
);

export const paymentRoute = router;
