import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "./user.enum";
import { userService } from "./user.service";
import { userValidation } from "./user.validation";

const router = Router();

// Only an existing admin can create staff/manager/admin accounts.
router.post(
  "/",
  isAuth,
  authorize(Role.ADMIN),
  validateRequest(userValidation.createUserValidationSchema),
  catchAsync(async (req, res) => {
    const user = await userService.createUser(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully",
      data: user,
    });
  })
);

router.get(
  "/",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const result = await userService.getAllUsers(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users fetched successfully",
      data: result,
    });
  })
);

router.get(
  "/:id",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User fetched successfully",
      data: user,
    });
  })
);

router.patch(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  validateRequest(userValidation.updateUserValidationSchema),
  catchAsync(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User updated successfully",
      data: user,
    });
  })
);

router.delete(
  "/:id",
  isAuth,
  authorize(Role.ADMIN),
  catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User deleted successfully",
      data: null,
    });
  })
);

export const userRoute = router;
