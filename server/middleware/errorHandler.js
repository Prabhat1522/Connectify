import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // If error is not an instance of ApiError, set to 500
  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
  }

  console.error("Centralized Error Handler caught:", {
    message: err.message,
    stack: err.stack,
    statusCode
  });

  return ApiResponse.error(res, message, statusCode);
};
