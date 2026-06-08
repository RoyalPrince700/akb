const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "accessible-knowledge-base-api",
    company: "Accessible Publishers Limited",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "not_connected",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
