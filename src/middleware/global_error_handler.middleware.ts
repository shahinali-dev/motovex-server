import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";
import config from "../config";
import { AppError } from "../errors/app_error";
import handleCastError from "../errors/handle_cast_error";
import handleDuplicateKeyError from "../errors/handle_duplicate_key_error";
import handleValidationError from "../errors/handle_validation_error";
import handleZodError from "../errors/handle_zod_error";
import { TErrorMessage } from "../interface/error";

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong";

  let errorMessage: TErrorMessage = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);

    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorMessage = simplifiedError?.errorMessages;
  } else if (err.name === "ValidationError") {
    const simplifiedError = handleValidationError(err);

    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorMessage = simplifiedError?.errorMessages;
  } else if (err.name === "CastError") {
    const simplifiedError = handleCastError(err);

    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorMessage = simplifiedError?.errorMessages;
  } else if (err.code && err.code === 11000) {
    const simplifiedError = handleDuplicateKeyError(err);

    statusCode = simplifiedError?.statusCode;
    message = simplifiedError?.message;
    errorMessage = simplifiedError?.errorMessages;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorMessage = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message;
    errorMessage = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessage,
    stack: config.NODE_ENV !== "production" ? err.stack : undefined,
  });
  next();
};

export default globalErrorHandler;
