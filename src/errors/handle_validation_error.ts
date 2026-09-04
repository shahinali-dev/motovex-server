import mongoose from "mongoose";
import httpStatus from "http-status";
import { TErrorMessage, TGenericErrorResponse } from "../interface/error";

const handleValidationError = (
  err: mongoose.Error.ValidationError
): TGenericErrorResponse => {
  const errorMessages: TErrorMessage = Object.values(err.errors).map(
    (error: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        path: error?.path,
        message: error?.message,
      };
    }
  );
  const statusCode = httpStatus.BAD_REQUEST;
  const message = "Validation error";
  return {
    statusCode,
    message,
    errorMessages,
  };
};

export default handleValidationError;
