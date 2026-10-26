const express = require("express");
const {
  getEnergyRecords,
  getEnergyRecord,
  createEnergyRecord,
  updateEnergyRecord,
  deleteEnergyRecord,
  getEnergySummary,
} = require("../controllers/energyController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.get("/summary", getEnergySummary);
router
  .route("/")
  .get(getEnergyRecords)
  .post(authorize("admin", "esg_manager"), createEnergyRecord);
router
  .route("/:id")
  .get(getEnergyRecord)
  .put(authorize("admin", "esg_manager"), updateEnergyRecord)
  .delete(authorize("admin", "esg_manager"), deleteEnergyRecord);

module.exports = router;
