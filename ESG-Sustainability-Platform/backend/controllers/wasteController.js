const asyncHandler = require("express-async-handler");
const WasteRecord = require("../models/WasteRecord");

const getWasteRecords = asyncHandler(async (req, res) => {
  const { facility, department, wasteType, from, to } = req.query;
  const filter = {};
  if (facility) filter.facility = facility;
  if (department) filter.department = department;
  if (wasteType) filter.wasteType = wasteType;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const records = await WasteRecord.find(filter)
    .populate("facility", "name")
    .populate("department", "name")
    .sort({ date: -1 });

  res.json({ success: true, count: records.length, data: records });
});

const getWasteRecord = asyncHandler(async (req, res) => {
  const record = await WasteRecord.findById(req.params.id)
    .populate("facility", "name")
    .populate("department", "name");
  if (!record) {
    res.status(404);
    throw new Error("Waste record not found");
  }
  res.json({ success: true, data: record });
});

const createWasteRecord = asyncHandler(async (req, res) => {
  const record = await WasteRecord.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: record });
});

const updateWasteRecord = asyncHandler(async (req, res) => {
  const record = await WasteRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Waste record not found");
  }
  Object.assign(record, req.body);
  await record.save();
  res.json({ success: true, data: record });
});

const deleteWasteRecord = asyncHandler(async (req, res) => {
  const record = await WasteRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Waste record not found");
  }
  await record.deleteOne();
  res.json({ success: true, message: "Waste record deleted" });
});

const getWasteSummary = asyncHandler(async (req, res) => {
  const records = await WasteRecord.find();
  const totalWaste = records.reduce((s, r) => s + r.quantity, 0);
  const recycledQuantity = records.reduce((s, r) => s + r.recycledQuantity, 0);
  const reusedQuantity = records.reduce((s, r) => s + r.reusedQuantity, 0);
  const disposedQuantity = records.reduce((s, r) => s + r.disposedQuantity, 0);

  const byType = {};
  records.forEach((r) => {
    byType[r.wasteType] = (byType[r.wasteType] || 0) + r.quantity;
  });

  res.json({
    success: true,
    data: {
      totalWaste,
      recycledQuantity,
      reusedQuantity,
      disposedQuantity,
      recyclingRate: totalWaste ? Number(((recycledQuantity / totalWaste) * 100).toFixed(2)) : 0,
      reuseRate: totalWaste ? Number(((reusedQuantity / totalWaste) * 100).toFixed(2)) : 0,
      disposalRate: totalWaste ? Number(((disposedQuantity / totalWaste) * 100).toFixed(2)) : 0,
      byType,
    },
  });
});

module.exports = {
  getWasteRecords,
  getWasteRecord,
  createWasteRecord,
  updateWasteRecord,
  deleteWasteRecord,
  getWasteSummary,
};
