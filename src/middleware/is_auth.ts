import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { AppError } from "../errors/app_error";
import { IJWTPayload } from "../modules/auth/auth.interface";

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let accessToken = req.cookies?.["access-token"];

  if (!accessToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }
  }

  if (!accessToken) {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Authentication token is missing")
    );
  }

  try {
    const secret = config.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "JWT secret is not configured"
      );
    }

    const decoded = jwt.verify(accessToken, secret) as JwtPayload | string;

    if (typeof decoded === "string" || !decoded._id) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token payload");
    }

    req.user = decoded as unknown as IJWTPayload;

    next();
  } catch {
    return next(
      new AppError(httpStatus.UNAUTHORIZED, "Invalid or expired token")
    );
  }
};
