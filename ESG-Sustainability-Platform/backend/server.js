require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/authRoutes");
const energyRoutes = require("./routes/energyRoutes");
const emissionRoutes = require("./routes/emissionRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const metricRoutes = require("./routes/metricRoutes");
const targetRoutes = require("./routes/targetRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const orgRoutes = require("./routes/orgRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ESG Platform API is running", timestamp: new Date() });
});

app.use("/api/auth", authRoutes);
app.use("/api/energy", energyRoutes);
app.use("/api/emissions", emissionRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/metrics", metricRoutes);
app.use("/api/targets", targetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
