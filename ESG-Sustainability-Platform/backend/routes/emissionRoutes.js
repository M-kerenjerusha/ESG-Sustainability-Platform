const express = require("express");
const {
  getEmissionRecords,
  getEmissionRecord,
  createEmissionRecord,
  updateEmissionRecord,
  deleteEmissionRecord,
  getEmissionSummary,
} = require("../controllers/emissionController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.get("/summary", getEmissionSummary);
router
  .route("/")
  .get(getEmissionRecords)
  .post(authorize("admin", "esg_manager"), createEmissionRecord);
router
  .route("/:id")
  .get(getEmissionRecord)
  .put(authorize("admin", "esg_manager"), updateEmissionRecord)
  .delete(authorize("admin", "esg_manager"), deleteEmissionRecord);

module.exports = router;
