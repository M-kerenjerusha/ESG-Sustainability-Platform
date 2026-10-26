const asyncHandler = require("express-async-handler");
const Target = require("../models/Target");

const withComputed = (targetDoc) => {
  const obj = targetDoc.toObject();
  const { progress, status } = targetDoc.computeStatus();
  obj.progress = progress;
  obj.status = status;
  return obj;
};

const getTargets = asyncHandler(async (req, res) => {
  const { category, department, status } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (department) filter.department = department;

  const targets = await Target.find(filter).populate("department", "name").sort({ deadline: 1 });
  let computed = targets.map(withComputed);
  if (status) computed = computed.filter((t) => t.status === status);

  res.json({ success: true, count: computed.length, data: computed });
});

const getTarget = asyncHandler(async (req, res) => {
  const target = await Target.findById(req.params.id).populate("department", "name");
  if (!target) {
    res.status(404);
    throw new Error("Target not found");
  }
  res.json({ success: true, data: withComputed(target) });
});

const createTarget = asyncHandler(async (req, res) => {
  const target = await Target.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: withComputed(target) });
});

const updateTarget = asyncHandler(async (req, res) => {
  const target = await Target.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error("Target not found");
  }
  Object.assign(target, req.body);
  await target.save();
  res.json({ success: true, data: withComputed(target) });
});

const deleteTarget = asyncHandler(async (req, res) => {
  const target = await Target.findById(req.params.id);
  if (!target) {
    res.status(404);
    throw new Error("Target not found");
  }
  await target.deleteOne();
  res.json({ success: true, message: "Target deleted" });
});

module.exports = { getTargets, getTarget, createTarget, updateTarget, deleteTarget };
