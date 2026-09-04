import { Response } from "express";
import httpStatus from "http-status";

const noDataFound = (res: Response, message: string) => {
  return res.json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message,
    data: [],
  });
};
export default noDataFound;
