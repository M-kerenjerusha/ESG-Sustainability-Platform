const express = require("express");
const {
  getTargets,
  getTarget,
  createTarget,
  updateTarget,
  deleteTarget,
} = require("../controllers/targetController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router
  .route("/")
  .get(getTargets)
  .post(authorize("admin", "esg_manager"), createTarget);
router
  .route("/:id")
  .get(getTarget)
  .put(authorize("admin", "esg_manager"), updateTarget)
  .delete(authorize("admin", "esg_manager"), deleteTarget);

module.exports = router;
