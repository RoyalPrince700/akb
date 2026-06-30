const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401);
    throw new Error("Authentication token is required");
  }

  const secret = process.env.JWT_SECRET || "development-secret-change-me";
  const decoded = jwt.verify(token, secret);
  const user = await User.findById(decoded.userId);

  if (!user) {
    res.status(401);
    throw new Error("Authenticated user no longer exists");
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error("You are not authorized to access this resource"));
  }

  return next();
};

const authorizeAdmin = authorize("admin");

const authorizeHrOrAdmin = authorize("hr", "admin");

const authorizeCsr = authorize("csr", "csrAdmin");

const authorizeCsrOrAdmin = authorize("csr", "csrAdmin", "admin");

const authorizeCsrAdmin = authorize("csrAdmin", "admin");

module.exports = {
  authorize,
  authorizeAdmin,
  authorizeCsrAdmin,
  authorizeCsr,
  authorizeCsrOrAdmin,
  authorizeHrOrAdmin,
  protect,
};
