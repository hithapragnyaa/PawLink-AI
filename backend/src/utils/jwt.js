import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET || JWT_SECRET === "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET") {
  throw new Error(
    "JWT_SECRET is missing or still using the default insecure value."
  );
}

const JWT_ISSUER = "pawlink-ai";
const JWT_AUDIENCE = "pawlink-ai-client";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};