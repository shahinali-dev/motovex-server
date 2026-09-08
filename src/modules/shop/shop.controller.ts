import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { shopService } from "./shop.service";
import { shopValidation } from "./shop.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(shopValidation.createShopValidationSchema),
  catchAsync(async (req, res) => {
    const shop = await shopService.createShop({
      ...req.body,
      createdBy: req.user!._id,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Shop created successfully",
      data: shop,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await shopService.getAllShops(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shops fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const shop = await shopService.getShopById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop fetched successfully",
      data: shop,
    });
  })
);

// Last rate this shop was charged, per product — for the order-creation screen.
router.get(
  "/:id/last-rates",
  isAuth,
  catchAsync(async (req, res) => {
    const rates = await shopService.getLastRates(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop's last given rates fetched successfully",
      data: rates,
    });
  })
);

// Order history for this shop, with the standard period filter
// (?period=today|week|month|3month|6month|1year|lifetime).
router.get(
  "/:id/orders",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await shopService.getOrderHistory(req.params.id, req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop order history fetched successfully",
      data: result,
    });
  })
);

router.patch(
  "/:id",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(shopValidation.updateShopValidationSchema),
  catchAsync(async (req, res) => {
    const shop = await shopService.updateShop(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop updated successfully",
      data: shop,
    });
  })
);

router.delete(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  catchAsync(async (req, res) => {
    await shopService.deleteShop(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Shop deleted successfully",
      data: null,
    });
  })
);

export const shopRoute = router;
