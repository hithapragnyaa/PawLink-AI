import {
  getAuthenticatedUser,
  loginUser,
  registerOrganizationAdmin,
} from "../services/auth.service.js";

const handleAuthError = (error, res, next) => {
  const knownMessages = [
    "Email is required.",
    "Invalid email or password.",
    "An account with this email already exists.",
    "Organization name is required.",
    "Organization name must not exceed 100 characters.",
    "First name is required.",
    "First name must not exceed 100 characters.",
    "Last name is required.",
    "Last name must not exceed 100 characters.",
    "Password is required.",
    "Password must contain at least 8 characters.",
    "Password must not exceed 128 characters.",
    "Please provide a valid email address.",
    "Administrator role is not configured.",
  ];

  if (knownMessages.includes(error.message)) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error.message ===
    "This email belongs to multiple organizations. Please provide organizationId."
  ) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

export const register = async (req, res, next) => {
  try {
    const result = await registerOrganizationAdmin(req.body);

    return res.status(201).json({
      success: true,
      message: "Organization and administrator account created successfully.",
      data: result,
    });
  } catch (error) {
    return handleAuthError(error, res, next);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    return handleAuthError(error, res, next);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(
      req.user.id,
      req.user.organizationId
    );

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Logout successful. Remove the access token from the client.",
  });
};