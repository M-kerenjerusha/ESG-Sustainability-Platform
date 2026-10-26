const mongoose = require("mongoose");

const wasteRecordSchema = new mongoose.Schema(
  {
    facility: { type: mongoose.Schema.Types.ObjectId, ref: "Facility", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    wasteType: {
      type: String,
      enum: ["Plastic", "Paper", "FoodWaste", "EWaste", "Metal", "General"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 }, // kg
    unit: { type: String, default: "kg" },
    recycledQuantity: { type: Number, default: 0, min: 0 },
    reusedQuantity: { type: Number, default: 0, min: 0 },
    disposedQuantity: { type: Number, default: 0, min: 0 },
    date: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

wasteRecordSchema.path("recycledQuantity").validate(function (val) {
  const recycled = val || 0;
  const reused = this.reusedQuantity || 0;
  const disposed = this.disposedQuantity || 0;
  if (this.quantity !== undefined && (recycled + reused + disposed) > (this.quantity + 0.05)) {
    return false;
  }
  return true;
}, "Sum of recycled, reused, and disposed quantities cannot exceed total waste quantity");

wasteRecordSchema.pre("save", function (next) {
  const recycled = this.recycledQuantity || 0;
  const reused = this.reusedQuantity || 0;
  const disposed = this.disposedQuantity || 0;

  // If disposed was not specified, calculate remainder automatically
  if (disposed === 0 && recycled + reused < this.quantity) {
    this.disposedQuantity = Number((this.quantity - recycled - reused).toFixed(2));
  }

  next();
});

module.exports = mongoose.model("WasteRecord", wasteRecordSchema);
