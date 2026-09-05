import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { deliveryService } from "./delivery.service";
import { deliveryValidation } from "./delivery.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.DM),
  validateRequest(deliveryValidation.createDeliveryValidationSchema),
  catchAsync(async (req, res) => {
    const delivery = await deliveryService.createDelivery(
      req.body,
      req.user!._id
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Delivery created successfully",
      data: delivery,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await deliveryService.getAllDeliveries(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Deliveries fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Delivery fetched successfully",
      data: delivery,
    });
  })
);

router.patch(
  "/:id/assign",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.DM),
  validateRequest(deliveryValidation.assignDeliveryValidationSchema),
  catchAsync(async (req, res) => {
    const delivery = await deliveryService.assignDelivery(
      req.params.id,
      req.body.assignedTo
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Delivery assigned successfully",
      data: delivery,
    });
  })
);

router.patch(
  "/:id/status",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.STAFF, Role.DM, Role.DSR, Role.SR),
  validateRequest(deliveryValidation.updateDeliveryStatusValidationSchema),
  catchAsync(async (req, res) => {
    const delivery = await deliveryService.updateStatus(
      req.params.id,
      req.body.status,
      req.user!._id,
      req.body.note
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Delivery status updated successfully",
      data: delivery,
    });
  })
);

export const deliveryRoute = router;
