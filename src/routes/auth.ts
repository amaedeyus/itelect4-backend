import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();

const getJwtSecret = (): string => {
const secret = process.env.JWT_SECRET;

if (!secret) {
throw new Error("JWT_SECRET is missing from the environment.");
}

return secret;
};

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
try {
const { name, email, password } = req.body;

if (
  typeof name !== "string" ||
  typeof email !== "string" ||
  typeof password !== "string" ||
  !name.trim() ||
  !email.trim() ||
  !password
) {
  res.status(400).json({
    message: "Name, email, and password are required.",
  });
  return;
}

if (password.length < 8) {
  res.status(400).json({
    message: "Password must be at least 8 characters long.",
  });
  return;
}

const normalizedEmail = email.trim().toLowerCase();

const existingUser = await User.findOne({
  email: normalizedEmail,
});

if (existingUser) {
  res.status(409).json({
    message: "An account with this email already exists.",
  });
  return;
}

// Public registration always creates a Student account.
// Do not accept the role from the request body.
const user = await User.create({
  name: name.trim(),
  email: normalizedEmail,
  password,
  role: "student",
});

res.status(201).json({
  message: "Account registered successfully.",
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  },
});

} catch (error) {
// Handle a duplicate email if two requests arrive at once.
if (
typeof error === "object" &&
error !== null &&
"code" in error &&
error.code === 11000
) {
res.status(409).json({
message: "An account with this email already exists.",
});
return;
}

console.error("Registration error:", error);

res.status(500).json({
  message: "Unable to register account.",
});

}
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
try {
const { email, password } = req.body;

if (
  typeof email !== "string" ||
  typeof password !== "string" ||
  !email.trim() ||
  !password
) {
  res.status(400).json({
    message: "Email and password are required.",
  });
  return;
}

// The password field has select: false in the User model,
// so explicitly include it for password verification.
const user = await User.findOne({
  email: email.trim().toLowerCase(),
}).select("+password");

if (!user) {
  res.status(401).json({
    message: "Invalid email or password.",
  });
  return;
}

if (!user.isActive) {
  res.status(403).json({
    message: "This account is inactive.",
  });
  return;
}

const passwordMatches = await user.comparePassword(password);

if (!passwordMatches) {
  res.status(401).json({
    message: "Invalid email or password.",
  });
  return;
}

const token = jwt.sign(
  { userId: user._id.toString() },
  getJwtSecret(),
  { expiresIn: "1d" }
);

res.status(200).json({
  message: "Login successful.",
  token,
  user: {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  },
});

} catch (error) {
console.error("Login error:", error);

res.status(500).json({
  message: "Unable to log in.",
});

}
});

export default router;
