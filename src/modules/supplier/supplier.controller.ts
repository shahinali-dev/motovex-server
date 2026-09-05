import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { supplierService } from "./supplier.service";
import { supplierValidation } from "./supplier.validation";

const router = Router();

router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(supplierValidation.createSupplierValidationSchema),
  catchAsync(async (req, res) => {
    const supplier = await supplierService.createSupplier({
      ...req.body,
      createdBy: req.user!._id,
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Supplier created successfully",
      data: supplier,
    });
  })
);

router.get(
  "/",
  isAuth,
  catchAsync(async (req, res) => {
    const result = await supplierService.getAllSuppliers(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Suppliers fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  catchAsync(async (req, res) => {
    const supplier = await supplierService.getSupplierById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Supplier fetched successfully",
      data: supplier,
    });
  })
);

router.patch(
  "/:id",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  validateRequest(supplierValidation.updateSupplierValidationSchema),
  catchAsync(async (req, res) => {
    const supplier = await supplierService.updateSupplier(
      req.params.id,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Supplier updated successfully",
      data: supplier,
    });
  })
);

router.delete(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  catchAsync(async (req, res) => {
    await supplierService.deleteSupplier(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Supplier deleted successfully",
      data: null,
    });
  })
);

export const supplierRoute = router;
