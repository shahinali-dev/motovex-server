import { Router } from "express";
import httpStatus from "http-status";
import { authorize } from "../../middleware/authorize";
import { isAuth } from "../../middleware/is_auth";
import catchAsync from "../../utils/catch_async.utils";
import sendResponse from "../../utils/send_response.utils";
import { Role } from "../user/user.enum";
import { reportService } from "./report.service";

const router = Router();

// Inventory visibility is fine for everyone logged in (staff need it day to day).
router.get(
  "/inventory",
  isAuth,
  catchAsync(async (req, res) => {
    const data = await reportService.getInventoryReport(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Inventory report generated successfully",
      data,
    });
  })
);

router.get(
  "/low-stock",
  isAuth,
  catchAsync(async (req, res) => {
    const data = await reportService.getLowStockAlert();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Low stock alert fetched successfully",
      data,
    });
  })
);

// Money/profit reports are restricted to ADMIN & MANAGER - staff shouldn't see margins.
router.get(
  "/sales",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getSalesReport(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Sales report generated successfully",
      data,
    });
  })
);

router.get(
  "/daily",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getDailyReport(req.query.date as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Daily sales & profit report generated successfully",
      data,
    });
  })
);

router.get(
  "/monthly",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getMonthlyReport(
      req.query.month as string,
      req.query.year as string
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Monthly report generated successfully",
      data,
    });
  })
);

router.get(
  "/yearly",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getYearlyReport(req.query.year as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Yearly report generated successfully",
      data,
    });
  })
);

router.get(
  "/lifetime",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getLifetimeReport();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Lifetime report generated successfully",
      data,
    });
  })
);

router.get(
  "/purchases",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER),
  catchAsync(async (req, res) => {
    const data = await reportService.getPurchaseReport(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Purchase report generated successfully",
      data,
    });
  })
);

// SR/DSR/DM-wise performance: deliveries handled + due collected in a range.
router.get(
  "/field-force",
  isAuth,
  authorize(Role.ADMIN, Role.MANAGER, Role.DM),
  catchAsync(async (req, res) => {
    const data = await reportService.getFieldForceReport(req.query);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "SR/DSR/DM performance report generated successfully",
      data,
    });
  })
);

export const reportRoute = router;
