const express = require("express");
const {
  getNotifications,
  markAsRead,
  generateNotifications,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.post("/generate", authorize("admin", "esg_manager"), generateNotifications);

module.exports = router;
