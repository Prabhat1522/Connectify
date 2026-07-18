export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export const ERROR_MESSAGES = {
  MISSING_DETAILS: "All fields are required.",
  USER_EXISTS: "User already exists with this email address.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  UNAUTHORIZED: "Unauthorized access, verification failed.",
  NOT_FOUND: "Resource not found.",
  GENERIC_ERROR: "Something went wrong. Please try again later.",
};

export const SUCCESS_MESSAGES = {
  SIGNUP_OTP: "OTP successfully sent to your email. Please verify to activate.",
  VERIFICATION_SUCCESS: "Account verified and registered successfully.",
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  PROFILE_UPDATE: "Profile updated successfully.",
};
