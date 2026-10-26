const express = require("express");
const {
  createReport,
  getReports,
  getReport,
  deleteReport,
  downloadReportPdf,
} = require("../controllers/reportController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.route("/").get(getReports).post(authorize("admin", "esg_manager"), createReport);
router.get("/:id/pdf", downloadReportPdf);
router.route("/:id").get(getReport).delete(authorize("admin", "esg_manager"), deleteReport);

module.exports = router;
