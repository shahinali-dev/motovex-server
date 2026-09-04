import { Router } from "express";
import httpStatus from "http-status";
import config from "../../config";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { authService } from "./auth.service";

const router = Router();

router.post(
  "/signin",
  catchAsync(async (req, res) => {
    const userData = req.body;
    const result = await authService.signIn(userData);

    const cookieOptions = {
      httpOnly: true,
      secure: config.NODE_ENV === "production",
      sameSite: "strict" as const,
    };

    res.cookie("access-token", result.accessToken, {
      ...cookieOptions,
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refresh-token", result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Logged in successfully",
      data: { user: result.user, accessToken: result.accessToken },
    });
  })
);

router.get(
  "/me",
  isAuth,
  catchAsync(async (req, res) => {
    const userId = req.user!._id;
    const user = await authService.getAuthUser(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User info fetched successfully",
      data: user,
    });
  })
);

router.post(
  "/signout",
  catchAsync(async (req, res) => {
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Logged out successfully",
      data: null,
    });
  })
);

export const authRoute = router;
