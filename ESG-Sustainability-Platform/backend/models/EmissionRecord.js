const mongoose = require("mongoose");

const emissionRecordSchema = new mongoose.Schema(
  {
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    source: {
      type: String,
      enum: ["Electricity", "Petrol", "Diesel", "NaturalGas", "Transportation", "Other"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, default: "litres" },
    emissionFactor: { type: Number, required: true, min: 0 }, // kg CO2e per unit
    co2e: { type: Number }, // kg CO2e, auto-calculated
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

emissionRecordSchema.pre("save", function (next) {
  this.co2e = Number((this.quantity * this.emissionFactor).toFixed(2));
  next();
});

module.exports = mongoose.model("EmissionRecord", emissionRecordSchema);
