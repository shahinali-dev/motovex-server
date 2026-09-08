import { AppError } from "../errors/app_error";
import httpStatus from "http-status";

export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Resolves a start/end Date range from a named preset — the shop/supplier
 * history filters the dashboard exposes (date, week, month, 3 month,
 * 6 month, 1 year, lifetime). `period` wins over explicit startDate/endDate
 * when both are given. Returns `{ startDate: null, endDate: null }` for
 * "lifetime" (no lower bound at all).
 */
export type HistoryPeriod =
  | "today"
  | "week"
  | "month"
  | "3month"
  | "6month"
  | "1year"
  | "lifetime";

export const resolvePeriodRange = (
  period?: string
): { startDate: Date | null; endDate: Date | null } => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  if (!period || period === "lifetime") {
    return { startDate: null, endDate: null };
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  switch (period as HistoryPeriod) {
    case "today":
      break; // startDate already at today's midnight
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "3month":
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case "6month":
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid period "${period}". Use one of: today, week, month, 3month, 6month, 1year, lifetime`
      );
  }

  return { startDate, endDate };
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
