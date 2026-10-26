const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "TargetNearingDeadline",
        "TargetOverdue",
        "MetricBelowTarget",
        "EmissionsIncreasing",
        "RecyclingBelowTarget",
      ],
      required: true,
    },
    message: { type: String, required: true },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "info" },
    relatedTo: { type: mongoose.Schema.Types.ObjectId, refPath: "relatedModel" },
    relatedModel: { type: String, enum: ["Target", "EsgMetric", "EmissionRecord", "WasteRecord"] },
    isRead: { type: Boolean, default: false },
    recipientRole: { type: String, enum: ["admin", "esg_manager", "employee", "all"], default: "all" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
