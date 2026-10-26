const asyncHandler = require("express-async-handler");
const Department = require("../models/Department");
const Facility = require("../models/Facility");
const User = require("../models/User");
const EnergyRecord = require("../models/EnergyRecord");
const EmissionRecord = require("../models/EmissionRecord");
const WasteRecord = require("../models/WasteRecord");
const Target = require("../models/Target");
const EsgMetric = require("../models/EsgMetric");

// Departments
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().populate("facility", "name").sort({ name: 1 });
  res.json({ success: true, count: departments.length, data: departments });
});

const createDepartment = asyncHandler(async (req, res) => {
  const department = await Department.create(req.body);
  res.status(201).json({ success: true, data: department });
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }
  Object.assign(department, req.body);
  await department.save();
  res.json({ success: true, data: department });
});

const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);
  if (!department) {
    res.status(404);
    throw new Error("Department not found");
  }

  // Prevent accidental orphaned references
  const [userCount, energyCount, emissionCount, wasteCount, targetCount, metricCount] = await Promise.all([
    User.countDocuments({ department: department._id }),
    EnergyRecord.countDocuments({ department: department._id }),
    EmissionRecord.countDocuments({ department: department._id }),
    WasteRecord.countDocuments({ department: department._id }),
    Target.countDocuments({ department: department._id }),
    EsgMetric.countDocuments({ department: department._id }),
  ]);

  const totalRefs = userCount + energyCount + emissionCount + wasteCount + targetCount + metricCount;
  if (totalRefs > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete department "${department.name}": it is currently referenced by ${userCount} user(s), ${energyCount + emissionCount + wasteCount} operational record(s), and ${targetCount + metricCount} target(s)/metric(s). Please reassign or remove these references first.`
    );
  }

  await department.deleteOne();
  res.json({ success: true, message: "Department deleted" });
});

// Facilities
const getFacilities = asyncHandler(async (req, res) => {
  const facilities = await Facility.find().sort({ name: 1 });
  res.json({ success: true, count: facilities.length, data: facilities });
});

const createFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.create(req.body);
  res.status(201).json({ success: true, data: facility });
});

const updateFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }
  Object.assign(facility, req.body);
  await facility.save();
  res.json({ success: true, data: facility });
});

const deleteFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);
  if (!facility) {
    res.status(404);
    throw new Error("Facility not found");
  }

  // Check referencing departments, users, and operational records
  const [deptCount, userCount, energyCount, emissionCount, wasteCount] = await Promise.all([
    Department.countDocuments({ facility: facility._id }),
    User.countDocuments({ facility: facility._id }),
    EnergyRecord.countDocuments({ facility: facility._id }),
    EmissionRecord.countDocuments({ facility: facility._id }),
    WasteRecord.countDocuments({ facility: facility._id }),
  ]);

  const totalRefs = deptCount + userCount + energyCount + emissionCount + wasteCount;
  if (totalRefs > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete facility "${facility.name}": it is referenced by ${deptCount} department(s), ${userCount} user(s), and ${energyCount + emissionCount + wasteCount} operational record(s). Please reassign or remove these references first.`
    );
  }

  await facility.deleteOne();
  res.json({ success: true, message: "Facility deleted" });
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
};
