import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { categoryService } from "./category.service";
import { categoryValidation } from "./category.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(categoryValidation.createCategoryValidationSchema),
  catchAsync(async (req, res) => {
    const category = await categoryService.createCategory({
      ...req.body,
      createdBy: req.user!._id,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Category created successfully",
      data: category,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await categoryService.getAllCategories(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Categories fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category fetched successfully",
      data: category,
    });
  })
);

router.patch(
  "/:id",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  catchAsync(async (req, res) => {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category updated successfully",
      data: category,
    });
  })
);

router.delete(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  catchAsync(async (req, res) => {
    await categoryService.deleteCategory(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Category deleted successfully",
      data: null,
    });
  })
);

export const categoryRoute = router;
