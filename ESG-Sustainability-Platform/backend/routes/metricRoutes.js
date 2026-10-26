const express = require("express");
const {
  getMetrics,
  getMetric,
  createMetric,
  updateMetric,
  deleteMetric,
  getEsgScore,
} = require("../controllers/metricController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.get("/score", getEsgScore);
router
  .route("/")
  .get(getMetrics)
  .post(authorize("admin", "esg_manager"), createMetric);
router
  .route("/:id")
  .get(getMetric)
  .put(authorize("admin", "esg_manager"), updateMetric)
  .delete(authorize("admin", "esg_manager"), deleteMetric);

module.exports = router;
