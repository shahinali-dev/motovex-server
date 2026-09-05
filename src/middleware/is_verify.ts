import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { AppError } from "../errors/app_error";
import { IJWTPayload } from "../modules/auth/auth.interface";

export const isVerify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let verifyToken = req.cookies?.["verify-token"];

  if (!verifyToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      verifyToken = authHeader.split(" ")[1];
    }
  }

  if (!verifyToken && req.body?.verifyToken) {
    verifyToken = req.body.verifyToken;
  }

  if (!verifyToken) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Verification token is missing")
    );
  }

  try {
    const decoded = jwt.verify(
      verifyToken,
      config.JWT_VERIFY_SECRET
    ) as JwtPayload | string;

    if (typeof decoded === "string" || !decoded._id) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token payload");
    }

    // Kept separate from a normal `isAuth` session (which represents a fully
    // authenticated, verified session) — this only proves "this OTP belongs
    // to this user".
    req.user = decoded as unknown as IJWTPayload;

    next();
  } catch {
    return next(
      new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired verification token"
      )
    );
  }
};
