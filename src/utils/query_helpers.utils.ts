import { AppError } from "../errors/app_error";
import httpStatus from "http-status";

export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Resolves a start/end Date range from `startDate` & `endDate` query params
 * (format: YYYY-MM-DD). Falls back to the given defaults when not provided.
 * `endDate` is inclusive (pushed to the end of that day).
 */
export const resolveDateRange = (
  startDateStr?: string,
  endDateStr?: string,
  fallbackDays = 30
) => {
  let endDate = endDateStr ? new Date(endDateStr) : new Date();
  if (endDateStr) {
    endDate.setHours(23, 59, 59, 999);
  }

  let startDate: Date;
  if (startDateStr) {
    startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - fallbackDays);
    startDate.setHours(0, 0, 0, 0);
  }

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid startDate/endDate. Use format YYYY-MM-DD"
    );
  }

  if (startDate > endDate) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "startDate cannot be after endDate"
    );
  }

  return { startDate, endDate };
};
