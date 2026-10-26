const asyncHandler = require("express-async-handler");
const EsgMetric = require("../models/EsgMetric");
const { calculateEsgScore } = require("../utils/scoreCalculator");

const getMetrics = asyncHandler(async (req, res) => {
  const { category, department, from, to } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (department) filter.department = department;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const metrics = await EsgMetric.find(filter).populate("department", "name").sort({ date: -1 });
  res.json({ success: true, count: metrics.length, data: metrics });
});

const getMetric = asyncHandler(async (req, res) => {
  const metric = await EsgMetric.findById(req.params.id).populate("department", "name");
  if (!metric) {
    res.status(404);
    throw new Error("Metric not found");
  }
  res.json({ success: true, data: metric });
});

const createMetric = asyncHandler(async (req, res) => {
  const metric = await EsgMetric.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: metric });
});

const updateMetric = asyncHandler(async (req, res) => {
  const metric = await EsgMetric.findById(req.params.id);
  if (!metric) {
    res.status(404);
    throw new Error("Metric not found");
  }
  Object.assign(metric, req.body);
  await metric.save();
  res.json({ success: true, data: metric });
});

const deleteMetric = asyncHandler(async (req, res) => {
  const metric = await EsgMetric.findById(req.params.id);
  if (!metric) {
    res.status(404);
    throw new Error("Metric not found");
  }
  await metric.deleteOne();
  res.json({ success: true, message: "Metric deleted" });
});

// @desc Get ESG score (Environmental/Social/Governance/Overall) + methodology
// @route GET /api/metrics/score
const getEsgScore = asyncHandler(async (req, res) => {
  const metrics = await EsgMetric.find();
  const score = calculateEsgScore(metrics);
  res.json({ success: true, data: score });
});

module.exports = { getMetrics, getMetric, createMetric, updateMetric, deleteMetric, getEsgScore };
