const asyncHandler = require("express-async-handler");
const PDFDocument = require("pdfkit");
const Report = require("../models/Report");
const EnergyRecord = require("../models/EnergyRecord");
const EmissionRecord = require("../models/EmissionRecord");
const WasteRecord = require("../models/WasteRecord");
const EsgMetric = require("../models/EsgMetric");
const Target = require("../models/Target");
const { calculateEsgScore } = require("../utils/scoreCalculator");
const { generateRecommendations } = require("../utils/recommendationEngine");

const buildSnapshot = async (periodStart, periodEnd) => {
  const dateFilter = { date: { $gte: periodStart, $lte: periodEnd } };

  const [energyRecords, emissionRecords, wasteRecords, metrics, targets] = await Promise.all([
    EnergyRecord.find(dateFilter),
    EmissionRecord.find(dateFilter),
    WasteRecord.find(dateFilter),
    EsgMetric.find(dateFilter),
    Target.find(),
  ]);

  const totalElectricity = energyRecords.reduce((s, r) => s + r.electricityConsumption, 0);
  const totalRenewable = energyRecords.reduce((s, r) => s + r.renewableEnergy, 0);
  const totalFuel = energyRecords.reduce((s, r) => s + r.fuelConsumption, 0);
  const totalEmissions = emissionRecords.reduce((s, r) => s + r.co2e, 0);
  const totalWaste = wasteRecords.reduce((s, r) => s + r.quantity, 0);
  const recycledQuantity = wasteRecords.reduce((s, r) => s + r.recycledQuantity, 0);

  const esgScore = calculateEsgScore(metrics);
  const targetProgress = targets.map((t) => ({ name: t.name, ...t.computeStatus() }));
  const risks = generateRecommendations({
    currentEmissions: totalEmissions,
    previousEmissions: totalEmissions, // simplified for point-in-time report
    currentEnergy: totalElectricity + totalFuel,
    previousEnergy: totalElectricity + totalFuel,
    wasteStats: { totalWaste, recycledQuantity },
    targets,
  });

  return {
    energy: {
      totalElectricity,
      totalRenewable,
      totalFuel,
      renewablePercentage: totalElectricity ? Number(((totalRenewable / totalElectricity) * 100).toFixed(2)) : 0,
    },
    emissions: { totalEmissions: Number(totalEmissions.toFixed(2)) },
    waste: {
      totalWaste,
      recycledQuantity,
      recyclingRate: totalWaste ? Number(((recycledQuantity / totalWaste) * 100).toFixed(2)) : 0,
    },
    esgScore,
    targetProgress,
    risks,
    metricsCount: metrics.length,
  };
};

// @desc Generate & store a report snapshot
// @route POST /api/reports
const createReport = asyncHandler(async (req, res) => {
  const { title, periodType, periodStart, periodEnd } = req.body;
  if (!title || !periodType || !periodStart || !periodEnd) {
    res.status(400);
    throw new Error("title, periodType, periodStart and periodEnd are required");
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400);
    throw new Error("Invalid start or end date format");
  }

  if (start > end) {
    res.status(400);
    throw new Error("Period start date cannot be after period end date");
  }

  const snapshot = await buildSnapshot(start, end);

  const report = await Report.create({
    title,
    periodType,
    periodStart: start,
    periodEnd: end,
    snapshot,
    generatedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: report });
});

const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find().populate("generatedBy", "name email").sort({ createdAt: -1 });
  res.json({ success: true, count: reports.length, data: reports });
});

const getReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("generatedBy", "name email");
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }
  res.json({ success: true, data: report });
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }
  await report.deleteOne();
  res.json({ success: true, message: "Report deleted" });
});

// @desc Download report as PDF
// @route GET /api/reports/:id/pdf
const downloadReportPdf = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate("generatedBy", "name email");
  if (!report) {
    res.status(404);
    throw new Error("Report not found");
  }

  const s = report.snapshot || {};
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${report.title.replace(/\s+/g, "_")}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("ESG Sustainability Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Organization: Demo Organization Pvt. Ltd.`);
  doc.text(`Report: ${report.title}`);
  doc.text(`Period: ${new Date(report.periodStart).toDateString()} - ${new Date(report.periodEnd).toDateString()}`);
  doc.text(`Generated by: ${report.generatedBy?.name || "N/A"} on ${new Date(report.createdAt).toDateString()}`);
  doc.moveDown();

  doc.fontSize(16).text("ESG Score", { underline: true });
  doc.fontSize(12).text(`Overall Score: ${s?.esgScore?.overallScore ?? 0} / 100`);
  doc.text(
    `Environmental: ${s?.esgScore?.environmentalScore ?? 0} | Social: ${s?.esgScore?.socialScore ?? 0} | Governance: ${s?.esgScore?.governanceScore ?? 0}`
  );
  doc.moveDown();

  doc.fontSize(16).text("Energy Statistics", { underline: true });
  doc.fontSize(12).text(`Total Electricity: ${s?.energy?.totalElectricity ?? 0} kWh`);
  doc.text(`Renewable Energy: ${s?.energy?.totalRenewable ?? 0} kWh (${s?.energy?.renewablePercentage ?? 0}%)`);
  doc.text(`Fuel Consumption: ${s?.energy?.totalFuel ?? 0} litres`);
  doc.moveDown();

  doc.fontSize(16).text("Carbon Emissions", { underline: true });
  doc.fontSize(12).text(`Total Estimated CO2e: ${s?.emissions?.totalEmissions ?? 0} kg`);
  doc.moveDown();

  doc.fontSize(16).text("Waste Management", { underline: true });
  doc.fontSize(12).text(`Total Waste: ${s?.waste?.totalWaste ?? 0} kg`);
  doc.text(`Recycled: ${s?.waste?.recycledQuantity ?? 0} kg (${s?.waste?.recyclingRate ?? 0}%)`);
  doc.moveDown();

  doc.fontSize(16).text("Sustainability Targets", { underline: true });
  const targets = Array.isArray(s?.targetProgress) ? s.targetProgress : [];
  if (targets.length === 0) {
    doc.fontSize(12).text("No active targets recorded in this snapshot.");
  } else {
    targets.forEach((t) => {
      doc.fontSize(12).text(`- ${t.name}: ${t.progress}% (${t.status})`);
    });
  }
  doc.moveDown();

  doc.fontSize(16).text("Risks & Recommendations", { underline: true });
  const risks = Array.isArray(s?.risks) ? s.risks : [];
  if (risks.length === 0) {
    doc.fontSize(12).text("No significant risks identified for this period.");
  } else {
    risks.forEach((r) => {
      doc.fontSize(13).text(`${r.title || "Risk Item"} [${(r.level || "info").toUpperCase()}]`, { continued: false });
      if (r.description) doc.fontSize(11).text(r.description);
      if (Array.isArray(r.recommendations)) {
        r.recommendations.forEach((rec) => doc.text(`  • ${rec}`));
      }
      doc.moveDown(0.5);
    });
  }

  doc.end();
});

module.exports = { createReport, getReports, getReport, deleteReport, downloadReportPdf };
