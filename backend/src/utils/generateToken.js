const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "development-secret-change-me";

  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
