const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");
const Target = require("../models/Target");
const EsgMetric = require("../models/EsgMetric");
const { isLowerBetter } = require("../utils/scoreCalculator");

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ recipientRole: "all" }, { recipientRole: req.user.role }],
  }).sort({ createdAt: -1 });
  res.json({ success: true, count: notifications.length, data: notifications });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

// @desc  Scan current data and (re)generate notifications. In production this
// would run on a schedule (cron); exposed here as an endpoint for demo purposes.
// @route POST /api/notifications/generate
const generateNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ isRead: false }); // clear stale auto-generated ones
  const created = [];
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const targets = await Target.find();
  for (const t of targets) {
    const { status } = t.computeStatus();
    if (status === "Overdue") {
      created.push(
        await Notification.create({
          type: "TargetOverdue",
          message: `Target "${t.name}" is overdue (deadline was ${new Date(t.deadline).toDateString()}).`,
          severity: "critical",
          relatedTo: t._id,
          relatedModel: "Target",
          recipientRole: "all",
        })
      );
    } else if (new Date(t.deadline) <= soon && new Date(t.deadline) >= now) {
      created.push(
        await Notification.create({
          type: "TargetNearingDeadline",
          message: `Target "${t.name}" deadline is approaching (${new Date(t.deadline).toDateString()}).`,
          severity: "warning",
          relatedTo: t._id,
          relatedModel: "Target",
          recipientRole: "all",
        })
      );
    }
  }

  const metrics = await EsgMetric.find();
  for (const m of metrics) {
    if (isLowerBetter(m.name)) {
      // For lower-is-better metrics (incidents, violations, emissions):
      // An adverse condition occurs when actual value exceeds the target
      if ((m.target > 0 && m.value > m.target * 1.1) || (m.target === 0 && m.value > 0)) {
        created.push(
          await Notification.create({
            type: "MetricBelowTarget",
            message: `ESG metric "${m.name}" (${m.value}${m.unit ? " " + m.unit : ""}) has exceeded target limit (${m.target}${m.unit ? " " + m.unit : ""}).`,
            severity: "warning",
            relatedTo: m._id,
            relatedModel: "EsgMetric",
            recipientRole: "all",
          })
        );
      }
    } else {
      // For higher-is-better metrics (renewable %, diversity, satisfaction):
      // An adverse condition occurs when actual value is significantly below target
      if (m.value < m.target * 0.8) {
        created.push(
          await Notification.create({
            type: "MetricBelowTarget",
            message: `ESG metric "${m.name}" (${m.value}${m.unit ? " " + m.unit : ""}) is significantly below target (${m.target}${m.unit ? " " + m.unit : ""}).`,
            severity: "warning",
            relatedTo: m._id,
            relatedModel: "EsgMetric",
            recipientRole: "all",
          })
        );
      }
    }
  }

  res.json({ success: true, count: created.length, data: created });
});

module.exports = { getNotifications, markAsRead, generateNotifications };
