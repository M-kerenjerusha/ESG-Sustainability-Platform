const mongoose = require("mongoose");

const energyRecordSchema = new mongoose.Schema(
  {
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    date: { type: Date, required: true },
    electricityConsumption: { type: Number, required: true, min: 0 }, // kWh
    renewableEnergy: { type: Number, required: true, min: 0, default: 0 }, // kWh
    fuelConsumption: { type: Number, required: true, min: 0, default: 0 }, // litres
    waterConsumption: { type: Number, required: true, min: 0, default: 0 }, // KL
    unit: { type: String, default: "kWh" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

energyRecordSchema.virtual("totalEnergy").get(function () {
  return this.electricityConsumption + this.fuelConsumption;
});

energyRecordSchema.virtual("renewablePercentage").get(function () {
  if (!this.electricityConsumption || this.electricityConsumption <= 0) return 0;
  return Number(Math.min(100, (this.renewableEnergy / this.electricityConsumption) * 100).toFixed(2));
});

energyRecordSchema.path("renewableEnergy").validate(function (val) {
  if (this.electricityConsumption !== undefined && val > this.electricityConsumption) {
    return false;
  }
  return true;
}, "Renewable energy cannot exceed total electricity consumption");

energyRecordSchema.set("toJSON", { virtuals: true });
energyRecordSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("EnergyRecord", energyRecordSchema);
