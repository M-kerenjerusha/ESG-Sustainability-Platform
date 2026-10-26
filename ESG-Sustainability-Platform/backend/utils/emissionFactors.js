// Standard reference emission factors (kg CO2e per unit) - simplified for demo purposes
// Sources are approximations of common published grid/fuel factors.
const EMISSION_FACTORS = {
  Electricity: 0.82, // kg CO2e per kWh (grid average)
  Petrol: 2.31, // kg CO2e per litre
  Diesel: 2.68, // kg CO2e per litre
  NaturalGas: 2.02, // kg CO2e per m3
  Transportation: 0.14, // kg CO2e per km
  Other: 1.0,
};

module.exports = EMISSION_FACTORS;
