const asyncHandler = require("express-async-handler");
const EnergyRecord = require("../models/EnergyRecord");
const EmissionRecord = require("../models/EmissionRecord");
const WasteRecord = require("../models/WasteRecord");
const EsgMetric = require("../models/EsgMetric");
const Target = require("../models/Target");
const { calculateEsgScore } = require("../utils/scoreCalculator");
const { generateRecommendations } = require("../utils/recommendationEngine");

const buildFilter = (query) => {
  const { facility, department, from, to } = query;
  const filter = {};
  if (facility) filter.facility = facility;
  if (department) filter.department = department;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  return filter;
};

const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// @desc Aggregated dashboard summary + chart-ready series
// @route GET /api/dashboard/summary
const getDashboardSummary = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query);

  const [energyRecords, emissionRecords, wasteRecords, metrics, targets] = await Promise.all([
    EnergyRecord.find(filter),
    EmissionRecord.find(filter),
    WasteRecord.find(filter),
    EsgMetric.find(req.query.department ? { department: req.query.department } : {}),
    Target.find(req.query.department ? { department: req.query.department } : {}),
  ]);

  // --- Totals ---
  const totalElectricity = energyRecords.reduce((s, r) => s + r.electricityConsumption, 0);
  const totalRenewable = energyRecords.reduce((s, r) => s + r.renewableEnergy, 0);
  const totalFuel = energyRecords.reduce((s, r) => s + r.fuelConsumption, 0);
  const totalEnergy = totalElectricity + totalFuel;
  const renewablePercentage = totalElectricity ? Number(((totalRenewable / totalElectricity) * 100).toFixed(2)) : 0;

  const totalEmissions = emissionRecords.reduce((s, r) => s + r.co2e, 0);

  const totalWaste = wasteRecords.reduce((s, r) => s + r.quantity, 0);
  const recycledQuantity = wasteRecords.reduce((s, r) => s + r.recycledQuantity, 0);
  const recyclingPercentage = totalWaste ? Number(((recycledQuantity / totalWaste) * 100).toFixed(2)) : 0;

  // --- ESG score ---
  const esgScore = calculateEsgScore(metrics);

  // --- Target progress overview ---
  const targetOverview = targets.map((t) => {
    const { progress, status } = t.computeStatus();
    return { name: t.name, category: t.category, progress, status, targetValue: t.targetValue, currentValue: t.currentValue };
  });

  // --- Time series (grouped by month) ---
  const energySeries = {};
  energyRecords.forEach((r) => {
    const k = monthKey(r.date);
    energySeries[k] = (energySeries[k] || 0) + r.electricityConsumption + r.fuelConsumption;
  });

  const emissionSeries = {};
  emissionRecords.forEach((r) => {
    const k = monthKey(r.date);
    emissionSeries[k] = (emissionSeries[k] || 0) + r.co2e;
  });

  const wasteSeries = {};
  wasteRecords.forEach((r) => {
    const k = monthKey(r.date);
    wasteSeries[k] = (wasteSeries[k] || 0) + r.quantity;
  });

  const wasteByType = {};
  wasteRecords.forEach((r) => {
    wasteByType[r.wasteType] = (wasteByType[r.wasteType] || 0) + r.quantity;
  });

  const toSeriesArray = (obj) =>
    Object.entries(obj)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([period, value]) => ({ period, value: Number(value.toFixed(2)) }));

  res.json({
    success: true,
    data: {
      totals: {
        totalEnergy: Number(totalEnergy.toFixed(2)),
        totalEmissions: Number(totalEmissions.toFixed(2)),
        totalWaste: Number(totalWaste.toFixed(2)),
        recyclingPercentage,
        renewablePercentage,
      },
      esgScore,
      targetOverview,
      charts: {
        energyOverTime: toSeriesArray(energySeries),
        emissionsOverTime: toSeriesArray(emissionSeries),
        wasteOverTime: toSeriesArray(wasteSeries),
        wasteByType: Object.entries(wasteByType).map(([type, value]) => ({ type, value: Number(value.toFixed(2)) })),
        renewableVsNonRenewable: [
          { name: "Renewable", value: Number(totalRenewable.toFixed(2)) },
          { name: "Non-Renewable", value: Math.max(0, Number((totalElectricity - totalRenewable).toFixed(2))) },
        ],
        esgCategoryComparison: [
          { category: "Environmental", score: esgScore.environmentalScore },
          { category: "Social", score: esgScore.socialScore },
          { category: "Governance", score: esgScore.governanceScore },
        ],
      },
    },
  });
});

// @desc  Risk & recommendation engine output
// @route GET /api/dashboard/risks
const getRisks = asyncHandler(async (req, res) => {
  const { facility, department } = req.query;
  const baseFilter = {};
  if (facility) baseFilter.facility = facility;
  if (department) baseFilter.department = department;

  const now = new Date();
  const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [currentEmissionRecords, previousEmissionRecords, currentEnergyRecords, previousEnergyRecords, wasteRecords, targets] =
    await Promise.all([
      EmissionRecord.find({ ...baseFilter, date: { $gte: currentPeriodStart } }),
      EmissionRecord.find({ ...baseFilter, date: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
      EnergyRecord.find({ ...baseFilter, date: { $gte: currentPeriodStart } }),
      EnergyRecord.find({ ...baseFilter, date: { $gte: previousPeriodStart, $lte: previousPeriodEnd } }),
      WasteRecord.find({ ...baseFilter, date: { $gte: currentPeriodStart } }),
      Target.find(department ? { department } : {}),
    ]);

  const currentEmissions = currentEmissionRecords.reduce((s, r) => s + r.co2e, 0);
  const previousEmissions = previousEmissionRecords.reduce((s, r) => s + r.co2e, 0);
  const currentEnergy = currentEnergyRecords.reduce((s, r) => s + r.electricityConsumption + r.fuelConsumption, 0);
  const previousEnergy = previousEnergyRecords.reduce((s, r) => s + r.electricityConsumption + r.fuelConsumption, 0);
  const totalWaste = wasteRecords.reduce((s, r) => s + r.quantity, 0);
  const recycledQuantity = wasteRecords.reduce((s, r) => s + r.recycledQuantity, 0);

  const risks = generateRecommendations({
    currentEmissions,
    previousEmissions,
    currentEnergy,
    previousEnergy,
    wasteStats: { totalWaste, recycledQuantity },
    targets,
  });

  res.json({ success: true, count: risks.length, data: risks });
});

module.exports = { getDashboardSummary, getRisks };
