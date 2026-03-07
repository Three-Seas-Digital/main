export interface MetricPair {
  before: number;
  after: number;
}

export interface EffectivenessResult {
  rating: string;
  averageImprovement: number;
}

export function calculateROI(cost: number, revenueChange: number): number | null;
export function calculateROAS(adSpend: number, revenue: number): number | null;
export function calculatePaybackPeriod(cost: number, monthlyRevenue: number): number | null;

/**
 * Calculate overall effectiveness rating from before/after metric pairs.
 * Can be called with either:
 * - One array of {before, after} objects: calculateEffectiveness([{before: 10, after: 15}])
 * - Two separate arrays: calculateEffectiveness([10, 20], [15, 25])
 */
export function calculateEffectiveness(
  beforeMetrics: MetricPair[] | number[],
  afterMetrics?: number[]
): EffectivenessResult;

export function ratingToDbEnum(rating: string): string;
