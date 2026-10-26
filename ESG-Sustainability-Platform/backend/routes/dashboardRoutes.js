const express = require("express");
const { getDashboardSummary, getRisks } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/summary", getDashboardSummary);
router.get("/risks", getRisks);

module.exports = router;
