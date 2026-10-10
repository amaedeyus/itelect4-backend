import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare global {
namespace Express {
interface Request {
userId?: string;
}
}
}

const auth = (
req: Request,
res: Response,
next: NextFunction
): void => {
const authorization = req.headers.authorization;

if (!authorization || !authorization.startsWith("Bearer ")) {
res.status(401).json({
message: "Authentication required. Provide a Bearer token.",
});
return;
}

const token = authorization.slice("Bearer ".length).trim();

if (!token) {
res.status(401).json({
message: "Authentication token is missing.",
});
return;
}

const secret = process.env.JWT_SECRET;

if (!secret) {
console.error("JWT_SECRET is missing from the environment.");

res.status(500).json({
  message: "Server authentication is not configured.",
});
return;

}

try {
const decoded = jwt.verify(token, secret);

if (
  typeof decoded === "string" ||
  typeof decoded.userId !== "string" ||
  !decoded.userId
) {
  res.status(401).json({
    message: "Invalid authentication token.",
  });
  return;
}

// Trust the ID only after the token has been verified.
req.userId = decoded.userId;

next();

} catch {
res.status(401).json({
message: "Invalid or expired authentication token.",
});
}
};

export default auth;
