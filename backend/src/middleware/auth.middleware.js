import { verifyAccessToken } from "../utils/jwt.js";

export const authenticate = (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    const [scheme, token] = authorizationHeader.split(" ");
    console.log("AUTH HEADER DIAGNOSTIC:", {
  headerPresent: Boolean(authorizationHeader),
  startsWithBearer: authorizationHeader.startsWith("Bearer "),
  partsCount: authorizationHeader.split(" ").length,
  scheme: authorizationHeader.split(" ")[0],
  tokenPresent: Boolean(authorizationHeader.split(" ")[1]),
});

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format. Use: Bearer <access_token>.",
      });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded?.sub || !decoded?.organizationId || !decoded?.role) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    req.user = {
      id: decoded.sub,
      organizationId: decoded.organizationId,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    next(error);
  }
};