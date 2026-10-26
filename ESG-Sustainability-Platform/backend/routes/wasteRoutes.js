const express = require("express");
const {
  getWasteRecords,
  getWasteRecord,
  createWasteRecord,
  updateWasteRecord,
  deleteWasteRecord,
  getWasteSummary,
} = require("../controllers/wasteController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.get("/summary", getWasteSummary);
router
  .route("/")
  .get(getWasteRecords)
  .post(authorize("admin", "esg_manager"), createWasteRecord);
router
  .route("/:id")
  .get(getWasteRecord)
  .put(authorize("admin", "esg_manager"), updateWasteRecord)
  .delete(authorize("admin", "esg_manager"), deleteWasteRecord);

module.exports = router;
