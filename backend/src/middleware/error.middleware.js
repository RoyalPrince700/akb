const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  let statusCode = error.statusCode || res.statusCode || 500;
  let message = error.message || "Server error";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors)
      .map((validationError) => validationError.message)
      .join(", ");
  }

  if (error.code === 11000) {
    statusCode = 409;
    if (error.keyPattern?.staffId) {
      message = "A user with this staff ID already exists";
    } else if (error.keyPattern?.email) {
      message = "A user with this email already exists";
    } else {
      message = "A record with this value already exists";
    }
  }

  if (statusCode < 400) {
    statusCode = 500;
  }

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
