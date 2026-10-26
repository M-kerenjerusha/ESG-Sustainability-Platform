const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    periodType: { type: String, enum: ["monthly", "yearly"], required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed }, // stored computed data at generation time
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
