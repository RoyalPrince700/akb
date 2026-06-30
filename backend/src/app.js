const cors = require("cors");
const express = require("express");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const crmRoutes = require("./routes/crm.routes");
const healthRoutes = require("./routes/health.routes");
const assessmentRoutes = require("./routes/assessment.routes");
const materialRoutes = require("./routes/material.routes");
const resultsRoutes = require("./routes/results.routes");
const staffRoutes = require("./routes/staff.routes");
const progressRoutes = require("./routes/progress.routes");
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
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/crm", crmRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
