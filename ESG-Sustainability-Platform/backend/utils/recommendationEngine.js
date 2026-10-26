/**
 * Rule-based ESG Risk & Recommendation Engine.
 * Pure function: takes aggregated current vs previous period data and
 * ESG metrics/targets, returns an array of risk objects. No external AI call.
 */

const generateRecommendations = ({
  currentEmissions,
  previousEmissions,
  currentEnergy,
  previousEnergy,
  wasteStats, // { totalWaste, recycledQuantity }
  targets, // array of target docs with computeStatus()
}) => {
  const risks = [];

  // 1. Carbon emission risk
  if (previousEmissions > 0) {
    const change = ((currentEmissions - previousEmissions) / previousEmissions) * 100;
    if (change > 10) {
      risks.push({
        category: "Carbon Emissions",
        level: change > 25 ? "critical" : "warning",
        title: "Carbon emissions have increased significantly",
        description: `Emissions rose by ${change.toFixed(1)}% compared to the previous period (${previousEmissions.toFixed(
          1
        )} → ${currentEmissions.toFixed(1)} kg CO2e).`,
        recommendations: [
          "Reduce overall energy consumption across facilities",
          "Increase renewable energy usage to offset grid-based emissions",
          "Review fuel usage and transportation/logistics routes for efficiency",
        ],
      });
    }
  } else if (previousEmissions === 0 && currentEmissions > 0) {
    risks.push({
      category: "Carbon Emissions",
      level: "warning",
      title: "New carbon emissions activity recorded",
      description: `Current emissions measured at ${currentEmissions.toFixed(1)} kg CO2e from a zero baseline in the previous period.`,
      recommendations: [
        "Track emission sources regularly to establish baseline stability",
        "Adopt low-carbon alternatives where feasible",
      ],
    });
  }

  // 2. Waste / recycling risk
  if (wasteStats && wasteStats.totalWaste > 0) {
    const recyclingRate = (wasteStats.recycledQuantity / wasteStats.totalWaste) * 100;
    if (recyclingRate < 50) {
      risks.push({
        category: "Waste Management",
        level: recyclingRate < 30 ? "critical" : "warning",
        title: "Recycling rate is below acceptable target",
        description: `Current recycling rate is ${recyclingRate.toFixed(1)}%, below the 50% baseline target.`,
        recommendations: [
          "Improve waste segregation at source across departments",
          "Add additional recycling collection points in high-waste facilities",
          "Run employee awareness campaigns on recycling practices",
        ],
      });
    }
  }

  // 3. Energy consumption risk
  if (previousEnergy > 0) {
    const change = ((currentEnergy - previousEnergy) / previousEnergy) * 100;
    if (change > 10) {
      risks.push({
        category: "Energy Consumption",
        level: change > 25 ? "critical" : "warning",
        title: "Energy consumption is trending upward",
        description: `Energy usage increased by ${change.toFixed(1)}% compared to the previous period.`,
        recommendations: [
          "Conduct an energy audit across high-consumption facilities",
          "Accelerate adoption of renewable energy sources",
          "Upgrade to energy-efficient equipment and lighting",
        ],
      });
    }
  } else if (previousEnergy === 0 && currentEnergy > 0) {
    risks.push({
      category: "Energy Consumption",
      level: "warning",
      title: "Energy consumption recorded from zero baseline",
      description: `Current energy usage is ${currentEnergy.toFixed(1)} kWh, establishing new operations in this period.`,
      recommendations: [
        "Monitor energy efficiency indicators across all facilities",
        "Integrate smart metering for sub-system load tracking",
      ],
    });
  }

  // 4. Target-based risks (At Risk / Overdue targets)
  (targets || []).forEach((t) => {
    const { progress, status } = t.computeStatus ? t.computeStatus() : { progress: 0, status: t.status };
    if (status === "At Risk" || status === "Overdue") {
      risks.push({
        category: t.category,
        level: status === "Overdue" ? "critical" : "warning",
        title: `Target "${t.name}" is ${status.toLowerCase()}`,
        description: `Progress is at ${progress}% with a deadline of ${new Date(t.deadline).toLocaleDateString()}.`,
        recommendations: [
          `Reassess the action plan for "${t.name}"`,
          "Allocate additional resources or budget to accelerate progress",
          "Escalate to department leadership for review",
        ],
      });
    }
  });

  return risks;
};

module.exports = { generateRecommendations };
