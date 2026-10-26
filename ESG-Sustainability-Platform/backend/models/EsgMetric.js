const mongoose = require("mongoose");

const esgMetricSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ["Environmental", "Social", "Governance"], required: true },
    value: { type: Number, required: true },
    target: { type: Number, required: true },
    unit: { type: String, default: "" },
    date: { type: Date, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EsgMetric", esgMetricSchema);
