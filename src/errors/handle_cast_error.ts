import httpStatus from "http-status";
import mongoose from "mongoose";
import { TErrorMessage } from "../interface/error";

const handleCastError = (err: mongoose.Error.CastError) => {
  const errorMessages: TErrorMessage = [
    {
      path: err.path,
      message: err.message,
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Invalid ID",
    errorMessages,
  };
};

export default handleCastError;
