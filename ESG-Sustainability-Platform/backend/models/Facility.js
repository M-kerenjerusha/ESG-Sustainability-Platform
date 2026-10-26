const mongoose = require("mongoose");

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    location: { type: String, default: "" },
    type: { type: String, default: "Office" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Facility", facilitySchema);
