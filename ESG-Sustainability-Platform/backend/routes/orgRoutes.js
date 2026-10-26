const express = require("express");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
} = require("../controllers/orgController");
const { protect } = require("../middleware/auth");
const { authorize } = require("../middleware/role");

const router = express.Router();

router.use(protect);

router.route("/departments").get(getDepartments).post(authorize("admin"), createDepartment);
router
  .route("/departments/:id")
  .put(authorize("admin"), updateDepartment)
  .delete(authorize("admin"), deleteDepartment);

router.route("/facilities").get(getFacilities).post(authorize("admin"), createFacility);
router
  .route("/facilities/:id")
  .put(authorize("admin"), updateFacility)
  .delete(authorize("admin"), deleteFacility);

module.exports = router;
