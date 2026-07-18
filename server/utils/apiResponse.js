class ApiResponse {
  constructor(statusCode, success, message, data = null) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    if (data !== null) {
      this.data = data;
    }
  }

  static success(res, message = "Success", data = null, statusCode = 200) {
    return res.status(statusCode).json(new ApiResponse(statusCode, true, message, data));
  }

  static error(res, message = "Error", statusCode = 500, data = null) {
    return res.status(statusCode).json(new ApiResponse(statusCode, false, message, data));
  }
}

export default ApiResponse;
