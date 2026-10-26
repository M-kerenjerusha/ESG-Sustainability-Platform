const asyncHandler = require("express-async-handler");
const EmissionRecord = require("../models/EmissionRecord");
const EMISSION_FACTORS = require("../utils/emissionFactors");

const getEmissionRecords = asyncHandler(async (req, res) => {
  const { facility, department, source, from, to } = req.query;
  const filter = {};
  if (facility) filter.facility = facility;
  if (department) filter.department = department;
  if (source) filter.source = source;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await EmissionRecord.find(filter)
    .populate("facility", "name")
    .populate("department", "name")
    .sort({ date: -1 });

  res.json({ success: true, count: records.length, data: records });
});

const getEmissionRecord = asyncHandler(async (req, res) => {
  const record = await EmissionRecord.findById(req.params.id)
    .populate("facility", "name")
    .populate("department", "name");
  if (!record) {
    res.status(404);
    throw new Error("Emission record not found");
  }
  res.json({ success: true, data: record });
});

const createEmissionRecord = asyncHandler(async (req, res) => {
  const body = { ...req.body, createdBy: req.user._id };
  if (!body.emissionFactor && body.source) {
    body.emissionFactor = EMISSION_FACTORS[body.source] || 1;
  }
  const record = await EmissionRecord.create(body);
  res.status(201).json({ success: true, data: record });
});

const updateEmissionRecord = asyncHandler(async (req, res) => {
  const record = await EmissionRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Emission record not found");
  }

  // If source changed and no new emission factor was explicitly passed, apply standard factor
  if (req.body.source && !req.body.emissionFactor && req.body.source !== record.source) {
    record.emissionFactor = EMISSION_FACTORS[req.body.source] || 1;
  }

  Object.assign(record, req.body);
  await record.save(); // triggers pre-save co2e recalculation
  res.json({ success: true, data: record });
});

const deleteEmissionRecord = asyncHandler(async (req, res) => {
  const record = await EmissionRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Emission record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Emission record deleted" });
});

const getEmissionSummary = asyncHandler(async (req, res) => {
  const records = await EmissionRecord.find();
  const totalCo2e = records.reduce((s, r) => s + r.co2e, 0);

  const bySource = {};
  records.forEach((r) => {
    bySource[r.source] = (bySource[r.source] || 0) + r.co2e;
  });

  res.json({
    success: true,
    data: { totalCo2e: Number(totalCo2e.toFixed(2)), bySource },
  });
});

module.exports = {
  getEmissionRecords,
  getEmissionRecord,
  createEmissionRecord,
  updateEmissionRecord,
  deleteEmissionRecord,
  getEmissionSummary,
};
