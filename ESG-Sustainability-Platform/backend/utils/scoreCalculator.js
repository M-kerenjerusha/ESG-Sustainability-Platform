/**
 * ESG Score Methodology (0-100 scale)
 * ------------------------------------
 * For each ESG metric, an achievement ratio is computed against its target:
 *   - If the metric is "higher is better" (e.g. renewable %, training hours),
 *     ratio = value / target (capped at 1.2, i.e. 120% of target max credit)
 *   - If the metric is "lower is better" (e.g. policy violations, incidents),
 *     ratio = target / value (capped at 1.2), with value=0 treated as perfect (ratio = 1.2)
 *
 * Each metric's capped ratio (max 1.0 counted, bonus ignored beyond) is converted
 * to a 0-100 contribution, then averaged within its category (Environmental,
 * Social, Governance) to produce 3 category scores.
 *
 * Overall ESG Score = weighted average of the 3 category scores:
 *   Environmental 40%, Social 30%, Governance 30%
 * (Environmental is weighted highest as it is typically the most data-rich
 * and regulator-scrutinized pillar for this type of platform.)
 */

const LOWER_IS_BETTER_KEYWORDS = [
  "emission",
  "violation",
  "incident",
  "consumption",
  "complaint",
];

const isLowerBetter = (metricName = "") => {
  const lower = String(metricName || "").toLowerCase();
  return LOWER_IS_BETTER_KEYWORDS.some((kw) => lower.includes(kw));
};

const metricScore = (metric) => {
  if (!metric) return 0;
  const rawVal = Number(metric.value);
  const rawTgt = Number(metric.target);

  // Guard against NaN
  const val = isNaN(rawVal) ? 0 : Math.max(0, rawVal);
  const tgt = isNaN(rawTgt) ? 0 : Math.max(0, rawTgt);

  if (tgt === 0 && val === 0) return 100;

  let ratio;
  if (isLowerBetter(metric.name)) {
    // For lower-is-better metrics (violations, incidents, emissions):
    // 0 is perfect score. If target is 0 but value > 0, score is 0.
    if (val === 0) return 100;
    if (tgt === 0) return 0;
    ratio = tgt / val;
  } else {
    // For higher-is-better metrics (renewable %, diversity, training):
    if (tgt === 0) return val > 0 ? 100 : 0;
    ratio = val / tgt;
  }

  // Cap achievement bonus at 120% and ensure non-negative
  ratio = Math.max(0, Math.min(ratio, 1.2));
  const score = Math.max(0, Math.min(100, ratio * 100));
  return Number(score.toFixed(2));
};

const calculateCategoryScore = (metrics) => {
  if (!Array.isArray(metrics) || !metrics.length) return 0;
  const total = metrics.reduce((sum, m) => sum + metricScore(m), 0);
  return Number((total / metrics.length).toFixed(2));
};

const BASE_CATEGORY_WEIGHTS = {
  Environmental: 0.4,
  Social: 0.3,
  Governance: 0.3,
};

const calculateEsgScore = (allMetrics = []) => {
  const list = Array.isArray(allMetrics) ? allMetrics : [];

  const byCategory = {
    Environmental: list.filter((m) => m && m.category === "Environmental"),
    Social: list.filter((m) => m && m.category === "Social"),
    Governance: list.filter((m) => m && m.category === "Governance"),
  };

  const environmentalScore = calculateCategoryScore(byCategory.Environmental);
  const socialScore = calculateCategoryScore(byCategory.Social);
  const governanceScore = calculateCategoryScore(byCategory.Governance);

  // Determine active categories to avoid artificially penalizing organizations with unpopulated pillars
  const activeCategories = [];
  if (byCategory.Environmental.length > 0) activeCategories.push("Environmental");
  if (byCategory.Social.length > 0) activeCategories.push("Social");
  if (byCategory.Governance.length > 0) activeCategories.push("Governance");

  let overallScore = 0;
  let activeWeights = { ...BASE_CATEGORY_WEIGHTS };

  if (activeCategories.length === 3) {
    // Standard full weight distribution (40% / 30% / 30%)
    overallScore = Number(
      (
        environmentalScore * BASE_CATEGORY_WEIGHTS.Environmental +
        socialScore * BASE_CATEGORY_WEIGHTS.Social +
        governanceScore * BASE_CATEGORY_WEIGHTS.Governance
      ).toFixed(2)
    );
  } else if (activeCategories.length > 0) {
    // Normalize weights proportionally among active pillars
    const totalBaseWeight = activeCategories.reduce((s, cat) => s + BASE_CATEGORY_WEIGHTS[cat], 0);
    activeWeights = {};
    activeCategories.forEach((cat) => {
      activeWeights[cat] = Number((BASE_CATEGORY_WEIGHTS[cat] / totalBaseWeight).toFixed(3));
    });

    let sum = 0;
    if (activeCategories.includes("Environmental")) sum += environmentalScore * activeWeights.Environmental;
    if (activeCategories.includes("Social")) sum += socialScore * activeWeights.Social;
    if (activeCategories.includes("Governance")) sum += governanceScore * activeWeights.Governance;
    overallScore = Number(sum.toFixed(2));
  } else {
    overallScore = 0;
  }

  return {
    environmentalScore,
    socialScore,
    governanceScore,
    overallScore,
    methodology: {
      description:
        "Each metric is scored against its target (capped at 120% achievement). Category score is the average of its metrics. Overall score is weighted: 40% Environmental, 30% Social, 30% Governance (normalized when pillars have no metrics).",
      baseWeights: BASE_CATEGORY_WEIGHTS,
      appliedWeights: activeWeights,
      metricCount: {
        Environmental: byCategory.Environmental.length,
        Social: byCategory.Social.length,
        Governance: byCategory.Governance.length,
      },
    },
  };
};

module.exports = { calculateEsgScore, metricScore, isLowerBetter };
