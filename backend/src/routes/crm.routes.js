const express = require("express");

const {
  createInteraction,
  createSalesRecord,
  createSalesRep,
  createSurveyDispatch,
  deleteSalesRep,
  getCustomerHistory,
  getCustomerLookup,
  getDashboardSummary,
  getInteraction,
  getPublicSurvey,
  getReportsSummary,
  importSalesReps,
  listCustomers,
  listInteractions,
  listSalesRecords,
  listSalesReps,
  listSurveyDispatches,
  listSurveyResponses,
  submitPublicSurveyResponse,
  updateInteraction,
  updateSalesRep,
} = require("../controllers/crm.controller");
const {
  authorizeCsrAdmin,
  authorizeCsrOrAdmin,
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/public-surveys/:token", getPublicSurvey);
router.post("/public-surveys/:token/respond", submitPublicSurveyResponse);

router.use(protect);

router.get("/dashboard-summary", authorizeCsrOrAdmin, getDashboardSummary);
router.get("/reports", authorizeCsrOrAdmin, getReportsSummary);

router.get("/customers", authorizeCsrOrAdmin, listCustomers);
router.get("/customers/lookup", authorizeCsrOrAdmin, getCustomerLookup);
router.get("/customers/history", authorizeCsrOrAdmin, getCustomerHistory);

router.get("/interactions", authorizeCsrOrAdmin, listInteractions);
router.post("/interactions", authorizeCsrOrAdmin, createInteraction);
router.get("/interactions/:id", authorizeCsrOrAdmin, getInteraction);
router.put("/interactions/:id", authorizeCsrOrAdmin, updateInteraction);

router.get("/sales-records", authorizeCsrOrAdmin, listSalesRecords);
router.post("/sales-records", authorizeCsrOrAdmin, createSalesRecord);

router.get("/sales-reps", authorizeCsrOrAdmin, listSalesReps);
router.post("/sales-reps", authorizeCsrAdmin, createSalesRep);
router.post("/sales-reps/import", authorizeCsrAdmin, importSalesReps);
router.put("/sales-reps/:id", authorizeCsrAdmin, updateSalesRep);
router.delete("/sales-reps/:id", authorizeCsrAdmin, deleteSalesRep);

router.get("/survey-dispatches", authorizeCsrOrAdmin, listSurveyDispatches);
router.post("/survey-dispatches", authorizeCsrOrAdmin, createSurveyDispatch);
router.get("/survey-responses", authorizeCsrAdmin, listSurveyResponses);

module.exports = router;
