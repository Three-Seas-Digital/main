// ============================================================
// ROI & Effectiveness Calculator Utilities
// ============================================================
// Pure functions for computing intervention financial metrics.
// No database or Express dependencies -- safe for unit testing.
// ============================================================

/**
 * Calculate Return on Investment percentage.
 *
 * @param {number} cost        - Total cost of the intervention
 * @param {number} revenueChange - Revenue change attributable to the intervention
 * @returns {number|null}      - ROI as a percentage, or null if cost is zero/invalid
 *
 * Example: cost = 5000, revenueChange = 15000 => ROI = 200%
 */
export function calculateROI(cost, revenueChange) {
  if (!cost || cost === 0) return null;
  return Math.round(((revenueChange - cost) / cost) * 10000) / 100;
}

/**
 * Calculate Return on Ad Spend.
 *
 * @param {number} adSpend  - Total advertising spend
 * @param {number} revenue  - Revenue generated from that spend
 * @returns {number|null}   - ROAS as a multiplier (e.g. 4.2x), or null if invalid
 */
export function calculateROAS(adSpend, revenue) {
  if (!adSpend || adSpend === 0) return null;
  return Math.round((revenue / adSpend) * 100) / 100;
}

/**
 * Calculate payback period in months.
 *
 * @param {number} cost            - Total upfront cost
 * @param {number} monthlyRevenue  - Monthly revenue attributable to intervention
 * @returns {number|null}          - Months to break even, or null if revenue is zero/invalid
 */
export function calculatePaybackPeriod(cost, monthlyRevenue) {
  if (!monthlyRevenue || monthlyRevenue <= 0) return null;
  return Math.round((cost / monthlyRevenue) * 100) / 100;
}

/**
 * Calculate overall effectiveness rating from before/after metric pairs.
 *
 * Compares each metric's before vs after value. A positive change percent
 * counts toward the weighted average improvement. The average improvement
 * is then mapped to a rating tier.
 *
 * @param {Array<{before: number, after: number}>} metrics - Array of before/after pairs
 * @returns {{ rating: string, averageImprovement: number }}
 *
 * Rating tiers:
 *   >= 50% average improvement  => 'Excellent'
 *   >= 20%                      => 'Good'
 *   >= 5%                       => 'Fair'
 *   <  5% (includes negative)   => 'Poor'
 */
export function calculateEffectiveness(beforeMetrics, afterMetrics) {
  // Accept either two arrays (before[], after[]) or a single array of {before, after} objects
  let pairs = [];

  if (Array.isArray(beforeMetrics) && Array.isArray(afterMetrics)) {
    // Two separate arrays of numbers
    const len = Math.min(beforeMetrics.length, afterMetrics.length);
    for (let i = 0; i < len; i++) {
      pairs.push({ before: beforeMetrics[i], after: afterMetrics[i] });
    }
  } else if (Array.isArray(beforeMetrics) && !Array.isArray(afterMetrics)) {
    // Single array of { before, after } objects (afterMetrics unused)
    pairs = beforeMetrics;
  } else {
    return { rating: 'Poor', averageImprovement: 0 };
  }

  if (pairs.length === 0) {
    return { rating: 'Poor', averageImprovement: 0 };
  }

  let totalPercent = 0;
  let validCount = 0;

  for (const pair of pairs) {
    const before = Number(pair.before);
    const after = Number(pair.after);
    if (isNaN(before) || isNaN(after) || before === 0) continue;
    totalPercent += ((after - before) / Math.abs(before)) * 100;
    validCount++;
  }

  if (validCount === 0) {
    return { rating: 'Poor', averageImprovement: 0 };
  }

  const averageImprovement = Math.round((totalPercent / validCount) * 100) / 100;

  let rating;
  if (averageImprovement >= 50) {
    rating = 'Excellent';
  } else if (averageImprovement >= 20) {
    rating = 'Good';
  } else if (averageImprovement >= 5) {
    rating = 'Fair';
  } else {
    rating = 'Poor';
  }

  return { rating, averageImprovement };
}

/**
 * Map our effectiveness rating string to the DB enum value.
 *
 * DB enum: 'exceptional', 'strong', 'moderate', 'weak', 'negative', 'pending'
 * Frontend uses: 'Excellent', 'Good', 'Fair', 'Poor'
 *
 * @param {string} rating - One of Excellent/Good/Fair/Poor
 * @returns {string} - DB enum value
 */
export function ratingToDbEnum(rating) {
  const map = {
    Excellent: 'exceptional',
    Good: 'strong',
    Fair: 'moderate',
    Poor: 'weak',
  };
  return map[rating] || 'pending';
}
