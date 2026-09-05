import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import { upload } from "../../middleware/upload.middleware";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { purchaseService } from "./purchase.service";
import { purchaseValidation } from "./purchase.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(purchaseValidation.createPurchaseValidationSchema),
  catchAsync(async (req, res) => {
    const purchase = await purchaseService.createPurchase(
      req.body,
      req.user!._id
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Purchase created successfully",
      data: purchase,
    });
  })
);

router.get(
  "/due-suppliers",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await purchaseService.getDueSuppliers();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Due suppliers fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await purchaseService.getAllPurchases(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Purchases fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const purchase = await purchaseService.getPurchaseById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Purchase fetched successfully",
      data: purchase,
    });
  })
);

router.patch(
  "/:id/status",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(purchaseValidation.updatePurchaseStatusValidationSchema),
  catchAsync(async (req, res) => {
    const purchase = await purchaseService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!._id,
      req.body.note
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Purchase status updated successfully",
      data: purchase,
    });
  })
);

router.post(
  "/:id/payment",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  upload.single("attachment"),
  validateRequest(purchaseValidation.recordPurchasePaymentValidationSchema),
  catchAsync(async (req, res) => {
    const purchase = await purchaseService.recordPayment(
      req.params.id,
      req.body.amount,
      req.user!._id,
      req.body.note,
      req.file
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment to supplier recorded successfully",
      data: purchase,
    });
  })
);

export const purchaseRoute = router;
