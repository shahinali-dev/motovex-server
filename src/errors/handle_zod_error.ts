import { ZodError, ZodIssue } from "zod";
import httpStatus from "http-status";
import { TErrorMessage, TGenericErrorResponse } from "../interface/error";

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorMessages: TErrorMessage = err.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue?.path.length - 1],
      message: issue?.message,
    };
  });

  const statusCode = httpStatus.BAD_REQUEST;
  const message = "Validation error";
  return {
    statusCode,
    message,
    errorMessages,
  };
};

export default handleZodError;
