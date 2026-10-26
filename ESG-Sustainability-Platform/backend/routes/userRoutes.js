const express = require("express");
const { getUsers, getUser, createUser, updateUser, deleteUser } = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect, authorize("admin"));
router.route("/").get(getUsers).post(createUser);
router.route("/:id").get(getUser).put(updateUser).delete(deleteUser);

module.exports = router;
