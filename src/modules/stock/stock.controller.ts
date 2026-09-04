import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { toPieces } from "../../utils/stock_unit.utils";
import ProductModel from "../product/product.model";
import { AppError } from "../../errors/app_error";
import { Role } from "../user/user.enum";
import { StockMovementType } from "./stock.enum";
import { stockService } from "./stock.service";
import { stockValidation } from "./stock.validation";

const router = Router();

router.post(
  "/:productId/adjust",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(stockValidation.adjustStockValidationSchema),
  catchAsync(async (req, res) => {
    const { productId } = req.params;
    const { quantity, unit, direction, note } = req.body;

    const product = await ProductModel.findById(productId);
    if (!product) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    const pieces = toPieces(quantity, unit, product.piecesPerBox);
    const signedQuantityPieces = direction === "in" ? pieces : -pieces;

    const result = await stockService.recordMovement({
      productId,
      type:
        direction === "in"
          ? StockMovementType.MANUAL_IN
          : StockMovementType.MANUAL_OUT,
      signedQuantityPieces,
      note,
      performedBy: req.user!._id,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Stock updated successfully",
      data: result,
    });
  })
);

router.get(
  "/:productId/logs",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await stockService.getLogsForProduct(
      req.params.productId,
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Stock logs fetched successfully",
      data: result,
    });
  })
);

export const stockRoute = router;
