import { Router } from "express";
import httpStatus from "http-status";
import config from "../../config";
import { AppError } from "../../errors/app_error";
import { isAuth } from "../../middleware/is_auth";
import { isVerify } from "../../middleware/is_verify";
import validateRequest from "../../middleware/validate_request.middleware";
import catchAsync from "../../utils/catch_async.utils";
import createToken from "../../utils/create_token";
import sendResponse from "../../utils/send_response.utils";
import { verifyToken } from "../../utils/verify_token";
import { userValidation } from "../user/user.validation";
import { IResponseStatus } from "./auth.enum";
import { IJWTPayload } from "./auth.interface";
import { authService } from "./auth.service";

const router = Router();

router.post(
  "/signin",
  catchAsync(async (req, res) => {
    const result = await authService.signIn(req.body);
    const clientType = req.headers["x-client-type"];
    const isProduction = config.NODE_ENV === "production";

    // Unverified user flow — an OTP has just been (re)sent to their email.
    if (result.requiresVerification) {
      if (clientType === "web") {
        res.cookie("verify-token", result.verifyToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? ("none" as const) : ("lax" as const),
          ...(isProduction && config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
          maxAge: config.VERIFY_COOKIE_EXPIRES_MS,
        });

        return res.status(httpStatus.FORBIDDEN).json({
          success: IResponseStatus.ERROR,
          statusCode: httpStatus.FORBIDDEN,
          message: "Email not verified. A new OTP has been sent to your email.",
          data: null,
        });
      } else {
        return res.status(httpStatus.FORBIDDEN).json({
          success: IResponseStatus.ERROR,
          statusCode: httpStatus.FORBIDDEN,
          message: "Email not verified. A new OTP has been sent to your email.",
          data: { verifyToken: result.verifyToken },
        });
      }
    }

    // Normal login flow
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      ...(isProduction && config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
    };

    if (clientType === "web") {
      res.cookie("refresh-token", result.refreshToken, {
        ...cookieOptions,
        maxAge: config.REFRESH_COOKIE_EXPIRES_MS,
      });

      res.cookie("access-token", result.accessToken, {
        ...cookieOptions,
        maxAge: config.ACCESS_COOKIE_EXPIRES_MS,
      });

      return res.status(httpStatus.OK).json({
        success: IResponseStatus.SUCCESS,
        statusCode: httpStatus.OK,
        message: "User logged in successfully",
        data: result.user,
      });
    } else {
      return res.status(httpStatus.OK).json({
        success: IResponseStatus.SUCCESS,
        statusCode: httpStatus.OK,
        message: "User logged in successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    }
  }),
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
  }),
);

router.post(
  "/verify-otp",
  isVerify,
  catchAsync(async (req, res) => {
    const { otp } = req.body;
    const { email, _id } = req.user!;

    if (!otp) {
      throw new AppError(httpStatus.BAD_REQUEST, "OTP is required");
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid OTP format. Must be 6 digits",
      );
    }

    const result = await authService.verifyOTP(String(_id), email, otp);
    const clientType = req.headers["x-client-type"];
    const isProduction = config.NODE_ENV === "production";

    res.clearCookie("verify-token");

    if (clientType === "web") {
      const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ("none" as const) : ("lax" as const),
        ...(isProduction && config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
      };

      res.cookie("refresh-token", result.data.refreshToken, {
        ...cookieOptions,
        maxAge: config.REFRESH_COOKIE_EXPIRES_MS,
      });
      res.cookie("access-token", result.data.accessToken, {
        ...cookieOptions,
        maxAge: config.ACCESS_COOKIE_EXPIRES_MS,
      });

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: IResponseStatus.SUCCESS,
        message: result.message,
        data: result.data.user,
      });
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: IResponseStatus.SUCCESS,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/resend-otp",
  isVerify,
  catchAsync(async (req, res) => {
    const { email, _id } = req.user!;

    const result = await authService.resendOTP(String(_id), email);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: IResponseStatus.SUCCESS,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/refresh-token",
  catchAsync(async (req, res) => {
    const clientType = req.headers["x-client-type"];
    const isProduction = config.NODE_ENV === "production";

    const refreshToken =
      clientType === "web" ? req.cookies?.["refresh-token"] : req.body.refreshToken;

    if (!refreshToken) {
      throw new AppError(
        clientType === "web" ? httpStatus.UNAUTHORIZED : httpStatus.BAD_REQUEST,
        clientType === "web"
          ? "Refresh token not found"
          : "Refresh token is required",
      );
    }

    try {
      const decoded = verifyToken(
        refreshToken,
        config.JWT_REFRESH_SECRET,
      ) as unknown as IJWTPayload;

      const jwtPayload: IJWTPayload = {
        _id: decoded?._id,
        email: decoded?.email,
        role: decoded?.role,
      };

      const newAccessToken = createToken(
        jwtPayload,
        config.JWT_ACCESS_SECRET,
        config.JWT_ACCESS_EXPIRE_IN,
      );

      if (clientType === "web") {
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? ("none" as const) : ("lax" as const),
          ...(isProduction && config.COOKIE_DOMAIN && { domain: config.COOKIE_DOMAIN }),
        };

        res.cookie("access-token", newAccessToken, {
          ...cookieOptions,
          maxAge: config.ACCESS_COOKIE_EXPIRES_MS,
        });

        return sendResponse(res, {
          success: IResponseStatus.SUCCESS,
          statusCode: httpStatus.OK,
          message: "Access token refreshed",
          data: { user: decoded },
        });
      }

      return sendResponse(res, {
        success: IResponseStatus.SUCCESS,
        statusCode: httpStatus.OK,
        message: "Access token refreshed",
        data: { accessToken: newAccessToken },
      });
    } catch (err) {
      throw new AppError(httpStatus.FORBIDDEN, "Invalid refresh token");
    }
  }),
);

router.post(
  "/forgot-password",
  validateRequest(userValidation.forgotPasswordValidationSchema),
  catchAsync(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: IResponseStatus.SUCCESS,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/reset-password",
  validateRequest(userValidation.resetPasswordValidationSchema),
  catchAsync(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const result = await authService.resetPassword(email, otp, newPassword);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: IResponseStatus.SUCCESS,
      message: result.message,
      data: result.data,
    });
  }),
);

router.post(
  "/signout",
  catchAsync(async (req, res) => {
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    res.status(httpStatus.OK).json({
      success: IResponseStatus.SUCCESS,
      statusCode: httpStatus.OK,
      message: "User logged out successfully",
      data: null,
    });
  }),
);

export const authRoute = router;
