const asyncHandler = require("express-async-handler");
const EnergyRecord = require("../models/EnergyRecord");

// @desc  Get all energy records (with optional filters)
// @route GET /api/energy
const getEnergyRecords = asyncHandler(async (req, res) => {
  const { facility, department, from, to } = req.query;
  const filter = {};
  if (facility) filter.facility = facility;
  if (department) filter.department = department;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await EnergyRecord.find(filter)
    .populate("facility", "name")
    .populate("department", "name")
    .sort({ date: -1 });

  res.json({ success: true, count: records.length, data: records });
});

const getEnergyRecord = asyncHandler(async (req, res) => {
  const record = await EnergyRecord.findById(req.params.id)
    .populate("facility", "name")
    .populate("department", "name");
  if (!record) {
    res.status(404);
    throw new Error("Energy record not found");
  }
  res.json({ success: true, data: record });
});

const createEnergyRecord = asyncHandler(async (req, res) => {
  const record = await EnergyRecord.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: record });
});

const updateEnergyRecord = asyncHandler(async (req, res) => {
  const record = await EnergyRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Energy record not found");
  }
  Object.assign(record, req.body);
  await record.save();
  res.json({ success: true, data: record });
});

const deleteEnergyRecord = asyncHandler(async (req, res) => {
  const record = await EnergyRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Energy record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Energy record deleted" });
});

// @desc  Summary stats - totals + renewable % + trend
// @route GET /api/energy/summary
const getEnergySummary = asyncHandler(async (req, res) => {
  const records = await EnergyRecord.find();
  const totalElectricity = records.reduce((s, r) => s + r.electricityConsumption, 0);
  const totalRenewable = records.reduce((s, r) => s + r.renewableEnergy, 0);
  const totalFuel = records.reduce((s, r) => s + r.fuelConsumption, 0);
  const totalWater = records.reduce((s, r) => s + r.waterConsumption, 0);

  const renewablePercentage = totalElectricity ? Number(((totalRenewable / totalElectricity) * 100).toFixed(2)) : 0;

  res.json({
    success: true,
    data: {
      totalElectricity,
      totalRenewable,
      totalFuel,
      totalWater,
      totalEnergy: totalElectricity + totalFuel,
      renewablePercentage,
    },
  });
});

module.exports = {
  getEnergyRecords,
  getEnergyRecord,
  createEnergyRecord,
  updateEnergyRecord,
  deleteEnergyRecord,
  getEnergySummary,
};
