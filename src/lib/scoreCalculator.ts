/**
 * scoreCalculator.ts
 * Heuristic scoring engine. Computes an overall feasibility score (0–100)
 * and maps it to a qualitative verdict.
 *
 * Weighting model:
 *   Market Score        → 30 pts  (TAM size signal + demand strength)
 *   Differentiation     → 25 pts  (agent's 1–10 score)
 *   Business Model      → 20 pts  (diversity of revenue streams)
 *   Risk Penalty        → -25 pts max (average severity across all risk items)
 */

import type {
  MarketFeasibility,
  CompetitiveLandscape,
  BusinessModel,
  RiskProfile,
  RiskSeverity,
  Verdict,
} from '../types/report';

const DEMAND_STRENGTH_SCORE: Record<string, number> = {
  Strong:   30,
  Moderate: 18,
  Weak:     8,
};

const SEVERITY_PENALTY: Record<RiskSeverity, number> = {
  Low:      0,
  Medium:   1,
  High:     2,
  Critical: 4,
};

function allRisks(riskProfile: RiskProfile) {
  return [
    ...riskProfile.technicalRisks,
    ...riskProfile.marketRisks,
    ...riskProfile.executionRisks,
    ...riskProfile.legalRisks,
  ];
}

export interface ScoreResult {
  score:   number;
  verdict: Verdict;
  breakdown: {
    marketScore:      number;
    differentiationScore: number;
    businessModelScore: number;
    riskPenalty:      number;
  };
}

export function calculateScore(
  market:      MarketFeasibility,
  competition: CompetitiveLandscape,
  business:    BusinessModel,
  risks:       RiskProfile
): ScoreResult {
  // --- Market Score (0–30) ---
  const marketScore = DEMAND_STRENGTH_SCORE[market.demand.strength] ?? 15;

  // --- Differentiation Score (0–25) ---
  const rawDiff = competition.differentiation.differentiationScore; // 1–10
  const differentiationScore = Math.round((rawDiff / 10) * 25);

  // --- Business Model Score (0–20) ---
  // More revenue streams + more pricing tiers = more resilient model
  const streamCount = business.revenueStreams.length;
  const tierCount   = business.pricing.suggestedTiers.length;
  const businessModelScore = Math.min(20, streamCount * 6 + tierCount * 4);

  // --- Risk Penalty (0–25) ---
  const items = allRisks(risks);
  const rawPenalty = items.reduce(
    (acc, item) => acc + SEVERITY_PENALTY[item.severity],
    0
  );
  // Normalise: max penalty of 25 reached at ~12 Critical risks
  const riskPenalty = Math.min(25, Math.round(rawPenalty * 1.5));

  const raw = marketScore + differentiationScore + businessModelScore - riskPenalty;
  const score = Math.max(0, Math.min(100, raw));

  const verdict: Verdict =
    score >= 80 ? 'Highly Viable' :
    score >= 60 ? 'Seed-Ready with Cautions' :
    score >= 40 ? 'Pivot Recommended' :
    'High-Risk Pass';

  return {
    score,
    verdict,
    breakdown: { marketScore, differentiationScore, businessModelScore, riskPenalty },
  };
}
