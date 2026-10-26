const mongoose = require("mongoose");

const targetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ["Environmental", "Social", "Governance"], required: true },
    currentValue: { type: Number, required: true },
    targetValue: { type: Number, required: true },
    unit: { type: String, default: "" },
    deadline: { type: Date, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    direction: { type: String, enum: ["increase", "decrease"], default: "increase" },
    status: {
      type: String,
      enum: ["On Track", "At Risk", "Achieved", "Overdue"],
      default: "On Track",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

targetSchema.methods.computeStatus = function () {
  const cur = Number(this.currentValue);
  const tgt = Number(this.targetValue);
  const currentVal = isNaN(cur) ? 0 : cur;
  const targetVal = isNaN(tgt) ? 0 : tgt;

  let progress = 0;
  if (this.direction === "increase") {
    progress = targetVal === 0 ? (currentVal > 0 ? 100 : 0) : (currentVal / targetVal) * 100;
  } else {
    // decrease-type target: lower is better
    if (currentVal <= targetVal) {
      progress = 100;
    } else {
      // Dynamic baseline: benchmark from 150% of target or 120% of current
      const start = targetVal === 0 ? currentVal * 1.5 : Math.max(currentVal * 1.1, targetVal * 1.5);
      const denom = start - targetVal;
      progress = denom <= 0 ? 100 : ((start - currentVal) / denom) * 100;
    }
  }

  progress = isNaN(progress) ? 0 : Math.max(0, Math.min(100, progress));

  const d = new Date(this.deadline);
  const isPast = !isNaN(d.getTime()) && new Date() > d;

  let status = "On Track";
  if (progress >= 100) status = "Achieved";
  else if (isPast) status = "Overdue";
  else if (progress < 50) status = "At Risk";

  return { progress: Number(progress.toFixed(1)), status };
};

targetSchema.pre("save", function (next) {
  const { status } = this.computeStatus();
  this.status = status;
  next();
});

module.exports = mongoose.model("Target", targetSchema);
