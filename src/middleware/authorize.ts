import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../errors/app_error";
import { Role } from "../modules/user/user.enum";

/**
 * Usage: router.post("/", isAuth, authorize(Role.ADMIN, Role.MANAGER), handler)
 * Call with no roles to just require *any* authenticated user (same as isAuth alone).
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(new AppError(httpStatus.UNAUTHORIZED, "Not authenticated"));
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return next(
        new AppError(
          httpStatus.FORBIDDEN,
          "You are not authorized to access this route"
        )
      );
    }
    next();
  };
};
