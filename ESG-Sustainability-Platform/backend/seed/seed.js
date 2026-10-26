require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Department = require("../models/Department");
const Facility = require("../models/Facility");
const EnergyRecord = require("../models/EnergyRecord");
const EmissionRecord = require("../models/EmissionRecord");
const WasteRecord = require("../models/WasteRecord");
const EsgMetric = require("../models/EsgMetric");
const Target = require("../models/Target");
const EMISSION_FACTORS = require("../utils/emissionFactors");

const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const monthsAgo = (n, day = 15) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(day);
  return d;
};

const run = async () => {
  await connectDB();
  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany(),
    Department.deleteMany(),
    Facility.deleteMany(),
    EnergyRecord.deleteMany(),
    EmissionRecord.deleteMany(),
    WasteRecord.deleteMany(),
    EsgMetric.deleteMany(),
    Target.deleteMany(),
  ]);

  console.log("Creating facilities & departments...");
  const facilities = await Facility.insertMany([
    { name: "Headquarters - Chennai", location: "Chennai, India", type: "Office" },
    { name: "Manufacturing Plant - Pune", location: "Pune, India", type: "Plant" },
  ]);

  const departments = await Department.insertMany([
    { name: "Operations", facility: facilities[1]._id },
    { name: "IT & Facilities", facility: facilities[0]._id },
    { name: "Human Resources", facility: facilities[0]._id },
    { name: "Finance", facility: facilities[0]._id },
  ]);

  console.log("Creating users...");
  const users = await User.create([
    {
      name: "Admin User",
      email: "admin@esg.com",
      password: "Admin@123",
      role: "admin",
      department: departments[1]._id,
      facility: facilities[0]._id,
    },
    {
      name: "ESG Manager",
      email: "manager@esg.com",
      password: "Manager@123",
      role: "esg_manager",
      department: departments[0]._id,
      facility: facilities[1]._id,
    },
    {
      name: "Employee User",
      email: "employee@esg.com",
      password: "Employee@123",
      role: "employee",
      department: departments[2]._id,
      facility: facilities[0]._id,
    },
  ]);

  console.log("Creating 6 months of energy, emission and waste records...");
  const energyDocs = [];
  const emissionDocs = [];
  const wasteDocs = [];
  const wasteTypes = ["Plastic", "Paper", "FoodWaste", "EWaste", "Metal", "General"];
  const emissionSources = ["Electricity", "Petrol", "Diesel", "NaturalGas", "Transportation"];

  for (let m = 5; m >= 0; m--) {
    const date = monthsAgo(m);
    for (const dept of departments) {
      const facility = dept.facility;
      const electricity = rand(3000, 6000) * (1 + (5 - m) * 0.02); // slight upward trend for demo risk
      const renewable = electricity * rand(0.15, 0.45);
      energyDocs.push({
        facility,
        department: dept._id,
        date,
        electricityConsumption: Number(electricity.toFixed(2)),
        renewableEnergy: Number(renewable.toFixed(2)),
        fuelConsumption: rand(100, 400),
        waterConsumption: rand(50, 200),
        unit: "kWh",
        createdBy: users[1]._id,
      });

      for (const source of emissionSources) {
        const quantity = rand(50, 300);
        emissionDocs.push({
          facility,
          department: dept._id,
          source,
          quantity,
          unit: source === "Transportation" ? "km" : source === "NaturalGas" ? "m3" : "litres",
          emissionFactor: EMISSION_FACTORS[source],
          co2e: Number((quantity * EMISSION_FACTORS[source]).toFixed(2)),
          date,
          createdBy: users[1]._id,
        });
      }

      for (const wasteType of wasteTypes) {
        const quantity = Number(rand(50, 400).toFixed(2));
        const recycled = Number((quantity * rand(0.3, 0.6)).toFixed(2));
        const reused = Number((quantity * rand(0.05, 0.15)).toFixed(2));
        const disposed = Number(Math.max(0, quantity - recycled - reused).toFixed(2));
        wasteDocs.push({
          facility,
          department: dept._id,
          wasteType,
          quantity,
          unit: "kg",
          recycledQuantity: recycled,
          reusedQuantity: reused,
          disposedQuantity: disposed,
          date,
          createdBy: users[1]._id,
        });
      }
    }
  }

  await EnergyRecord.insertMany(energyDocs);
  await EmissionRecord.insertMany(emissionDocs);
  await WasteRecord.insertMany(wasteDocs);

  console.log("Creating ESG metrics...");
  const metricDefs = [
    // Environmental
    { name: "Carbon Emissions", category: "Environmental", value: 4200, target: 4000, unit: "tCO2e" },
    { name: "Energy Consumption", category: "Environmental", value: 58000, target: 55000, unit: "kWh" },
    { name: "Renewable Energy Percentage", category: "Environmental", value: 32, target: 60, unit: "%" },
    { name: "Waste Recycling Percentage", category: "Environmental", value: 48, target: 75, unit: "%" },
    { name: "Water Consumption", category: "Environmental", value: 1200, target: 1000, unit: "KL" },
    // Social
    { name: "Employee Training Hours", category: "Social", value: 18, target: 24, unit: "hrs" },
    { name: "Employee Satisfaction", category: "Social", value: 78, target: 85, unit: "%" },
    { name: "Workplace Safety Incidents", category: "Social", value: 3, target: 0, unit: "count" },
    { name: "Diversity Ratio", category: "Social", value: 41, target: 45, unit: "%" },
    { name: "Community Activities", category: "Social", value: 6, target: 8, unit: "events" },
    // Governance
    { name: "Compliance Rate", category: "Governance", value: 92, target: 100, unit: "%" },
    { name: "Ethics Training Completion", category: "Governance", value: 88, target: 100, unit: "%" },
    { name: "Policy Violations", category: "Governance", value: 2, target: 0, unit: "count" },
    { name: "Audit Completion Rate", category: "Governance", value: 95, target: 100, unit: "%" },
    { name: "Data Privacy Incidents", category: "Governance", value: 1, target: 0, unit: "count" },
  ];

  await EsgMetric.insertMany(
    metricDefs.map((m) => ({
      ...m,
      date: monthsAgo(0),
      department: departments[Math.floor(Math.random() * departments.length)]._id,
      createdBy: users[0]._id,
    }))
  );

  console.log("Creating sustainability targets...");
  const targetDefs = [
    {
      name: "Reduce carbon emissions to 60 tCO2e",
      category: "Environmental",
      currentValue: 84,
      targetValue: 60,
      unit: "tCO2e",
      direction: "decrease",
      deadline: monthsAgo(-4),
    },
    {
      name: "Increase renewable energy to 60%",
      category: "Environmental",
      currentValue: 32,
      targetValue: 60,
      unit: "%",
      direction: "increase",
      deadline: monthsAgo(-6),
    },
    {
      name: "Achieve 75% recycling rate",
      category: "Environmental",
      currentValue: 48,
      targetValue: 75,
      unit: "%",
      direction: "increase",
      deadline: monthsAgo(-3),
    },
    {
      name: "Reduce water consumption by 15%",
      category: "Environmental",
      currentValue: 1200,
      targetValue: 1020,
      unit: "KL",
      direction: "decrease",
      deadline: monthsAgo(1), // already past -> Overdue
    },
    {
      name: "Achieve 100% ethics training completion",
      category: "Governance",
      currentValue: 88,
      targetValue: 100,
      unit: "%",
      direction: "increase",
      deadline: monthsAgo(-2),
    },
  ];

  await Target.insertMany(
    targetDefs.map((t) => ({
      ...t,
      department: departments[Math.floor(Math.random() * departments.length)]._id,
      createdBy: users[0]._id,
    }))
  );

  console.log("\n✅ Seed complete!\n");
  console.log("Test credentials:");
  console.log("  Admin:       admin@esg.com / Admin@123");
  console.log("  ESG Manager: manager@esg.com / Manager@123");
  console.log("  Employee:    employee@esg.com / Employee@123");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
