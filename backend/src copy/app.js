const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

const healthRoutes = require("./routes/health.routes");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

const app = express();

const allowedOrigin = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    message: "Accessible Knowledge Base API",
    company: "Accessible Publishers Limited",
  });
});

app.use("/api/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
