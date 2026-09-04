import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { productService } from "./product.service";
import { productValidation } from "./product.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(productValidation.createProductValidationSchema),
  catchAsync(async (req, res) => {
    const product = await productService.createProduct(
      req.body,
      req.user!._id
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Product created successfully",
      data: product,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await productService.getAllProducts(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Products fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product fetched successfully",
      data: product,
    });
  })
);

router.patch(
  "/:id",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(productValidation.updateProductValidationSchema),
  catchAsync(async (req, res) => {
    const product = await productService.updateProduct(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product updated successfully",
      data: product,
    });
  })
);

router.delete(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  catchAsync(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Product deleted successfully",
      data: null,
    });
  })
);

export const productRoute = router;
