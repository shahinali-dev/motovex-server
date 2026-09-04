/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TErrorMessage, TGenericErrorResponse } from "../interface/error";

const handleDuplicateKeyError = (err: any): TGenericErrorResponse => {
  const message = err.message.match(/: "([^"]+)"/)?.[1];
  const errorMessages: TErrorMessage = [
    {
      path: "",
      message: `${message} is already exist`,
    },
  ];
  return {
    statusCode: httpStatus.BAD_REQUEST,
    message: "Duplicate key error",
    errorMessages,
  };
};

export default handleDuplicateKeyError;
