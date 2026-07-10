/**
 * reportGenerator.ts
 * Generates a fully dynamic, investor-ready Investment Report containing
 * calculated sub-scores, SWOT grids, Recommended MVP, and Next Steps
 * compiled from the actual multi-agent pipeline output.
 */

import type { StartupValidationReport, RiskItem } from '../types/report';

export interface ScoreBreakdown {
  overall: number;
  idea: number;
  market: number;
  competition: number;
  businessModel: number;
  risk: number;
}

export interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface MVPData {
  title: string;
  description: string;
  coreFeatures: string[];
  milestones: string[];
}

export interface NextStepItem {
  action: string;
  priority: 'High' | 'Medium' | 'Low';
  category: string;
}

export interface InvestmentReportData {
  executiveSummary: string;
  scores: ScoreBreakdown;
  swot: SWOTData;
  recommendedMvp: MVPData;
  nextSteps: NextStepItem[];
}

/**
 * Calculates individual component scores (0-100) and compiles
 * a professional, unified investment report from agent outputs.
 */
export function generateInvestmentReport(report: StartupValidationReport): InvestmentReportData {
  const { ideaAnalysis, marketFeasibility, competitiveLandscape, businessModel, riskProfile } = report;

  // ---------------------------------------------------------------------------
  // 1. Component Score Calculations (0-100)
  // ---------------------------------------------------------------------------

  // Idea Score: based on problem severity, customer pain points size, and value prop clarity
  const severityMultiplier = 
    ideaAnalysis.problem.severity === 'Critical' ? 100 :
    ideaAnalysis.problem.severity === 'High' ? 85 :
    ideaAnalysis.problem.severity === 'Medium' ? 70 : 50;
  const painPointsBonus = Math.min(15, (ideaAnalysis.customer.painPoints.length) * 5);
  const ideaScore = Math.min(100, Math.round(severityMultiplier * 0.85 + painPointsBonus));

  // Market Score: based on TAM description complexity and demand strength
  const tamBonus = marketFeasibility.marketSize.tam.length > 5 ? 10 : 0;
  const demandBase = 
    marketFeasibility.demand.strength === 'Strong' ? 80 :
    marketFeasibility.demand.strength === 'Moderate' ? 65 : 45;
  const demandIndicatorsBonus = Math.min(10, marketFeasibility.demand.indicators.length * 3);
  const marketScore = Math.min(100, demandBase + tamBonus + demandIndicatorsBonus);

  // Competition Score: derived directly from the agent's differentiation score [1, 10]
  const competitionScore = Math.min(100, competitiveLandscape.differentiation.differentiationScore * 10);

  // Business Model Score: based on Suggested Tiers count and Revenue Streams count
  const tierCount = businessModel.pricing.suggestedTiers.length;
  const streamCount = businessModel.revenueStreams.length;
  const businessModelScore = Math.min(100, (tierCount * 20) + (streamCount * 15) + 15);

  // Risk Score: inverse of risk severity penalties (higher score = lower risk)
  const allRisks: RiskItem[] = [
    ...riskProfile.technicalRisks,
    ...riskProfile.marketRisks,
    ...riskProfile.executionRisks,
    ...riskProfile.legalRisks,
  ];
  const severityPoints = allRisks.reduce((sum, r) => {
    const penalty = 
      r.severity === 'Critical' ? 25 :
      r.severity === 'High' ? 15 :
      r.severity === 'Medium' ? 8 : 3;
    return sum + penalty;
  }, 0);
  // Normalize risk score to 0-100 scale
  const riskScore = Math.max(10, Math.min(100, 100 - Math.round(severityPoints / Math.max(1, allRisks.length))));

  const overall = report.overallScore;

  // ---------------------------------------------------------------------------
  // 2. Executive Summary Synthesis
  // ---------------------------------------------------------------------------
  const firstPainPoint = ideaAnalysis.customer.painPoints[0] || 'market inefficiencies';
  const primaryCompetitor = competitiveLandscape.directCompetitors[0]?.name || 'incumbents';
  const primaryMitigation = riskProfile.marketRisks[0]?.mitigation || riskProfile.technicalRisks[0]?.mitigation || 'phased validation';

  const executiveSummary = 
    `We classify this project as "${report.overallVerdict}" with an overall feasibility score of ${overall}/100. ` +
    `The venture addresses a ${ideaAnalysis.problem.severity.toLowerCase()}-severity problem in the "${ideaAnalysis.startupCategory}" space, specifically targeting ${ideaAnalysis.customer.primarySegment} who struggle with "${firstPainPoint}". ` +
    `With an addressable market sized at ${marketFeasibility.marketSize.tam}, the value proposition is built around a ${businessModel.pricing.structure} structure to capture transaction value. ` +
    `Defensibility is established via its core differentiator: "${ideaAnalysis.uniqueness.coreDifferentiator}". ` +
    `To counter competition from established players like ${primaryCompetitor}, execution must prioritize early risk mitigation, specifically focusing on "${primaryMitigation}".`;

  // ---------------------------------------------------------------------------
  // 3. SWOT Construction
  // ---------------------------------------------------------------------------
  const positiveTrends = marketFeasibility.trends
    .filter(t => t.impact === 'Positive')
    .map(t => t.trendDescription);
  const neutralTrends = marketFeasibility.trends
    .filter(t => t.impact === 'Neutral')
    .map(t => t.trendDescription);

  const swot: SWOTData = {
    strengths: [
      ideaAnalysis.uniqueness.coreDifferentiator,
      ...competitiveLandscape.differentiation.vectors.slice(0, 2),
    ],
    weaknesses: [
      `Vulnerable to direct competitor strengths: ${competitiveLandscape.directCompetitors[0]?.strengths.slice(0, 2).join(', ') || 'market presence'}.`,
      `Friction compared to legacy alternatives: ${competitiveLandscape.indirectCompetitors[0]?.alternativeMethod || 'manual workarounds'}.`,
      `Technical complexity regarding: ${riskProfile.technicalRisks[0]?.risk || 'core system scaling'}.`,
    ],
    opportunities: [
      `Beachhead Market Entry: ${marketFeasibility.opportunity}`,
      ...positiveTrends.slice(0, 2),
      ...neutralTrends.slice(0, 1),
    ],
    threats: [
      `Disintermediation / Payment Leakage: ${riskProfile.marketRisks[0]?.risk || 'customer migration offline'}.`,
      `Compliance / Regulatory hurdles: ${riskProfile.legalRisks[0]?.risk || 'licensing requirements'}.`,
      `Operational scaling bottlenecks: ${riskProfile.executionRisks[0]?.risk || 'cold start onboarding'}.`,
    ],
  };

  // ---------------------------------------------------------------------------
  // 4. Recommended MVP Specification
  // ---------------------------------------------------------------------------
  const entryTier = businessModel.pricing.suggestedTiers[0];
  const mvpFeatures = [
    ideaAnalysis.uniqueness.coreDifferentiator,
    ...(entryTier?.featuresIncluded.slice(0, 2) || ['Core booking flow', 'Basic profiles']),
    `Beachhead-focused deployment: ${marketFeasibility.opportunity.split(',')[0] || 'Selected test city'}.`,
  ];

  const recommendedMvp: MVPData = {
    title: `MVP: ${ideaAnalysis.startupCategory.split('/')[1] || ideaAnalysis.startupCategory.split(' ')[0] || 'Core'} Beta Platform`,
    description: `A simplified version of the product focused on delivering "${ideaAnalysis.uniqueness.valueProposition}" to "${ideaAnalysis.customer.primarySegment}" using a "${entryTier?.tierName || 'Standard'}" tier framework.`,
    coreFeatures: mvpFeatures,
    milestones: [
      `Deploy landing page & collect 500+ waitlist entries in the beachhead location.`,
      `Release private beta containing the 3 core MVP features to 50 active pilot hosts/users.`,
      `Test payment gateway logic using a transactional take-rate fee model.`,
      `Integrate primary risk mitigation: "${riskProfile.marketRisks[0]?.mitigation.slice(0, 60) || 'Secure safety insurance coverage'}" before public scaling.`,
    ],
  };

  // ---------------------------------------------------------------------------
  // 5. Next Steps Plan
  // ---------------------------------------------------------------------------
  const nextSteps: NextStepItem[] = [];

  // Map high priority items from critical risk mitigations
  const criticalLegal = riskProfile.legalRisks[0];
  if (criticalLegal) {
    nextSteps.push({
      action: `Legal Compliance: ${criticalLegal.mitigation}`,
      priority: criticalLegal.severity === 'Critical' || criticalLegal.severity === 'High' ? 'High' : 'Medium',
      category: 'Legal / Regulatory',
    });
  }

  const criticalMarket = riskProfile.marketRisks[0];
  if (criticalMarket) {
    nextSteps.push({
      action: `Retention Strategy: ${criticalMarket.mitigation}`,
      priority: criticalMarket.severity === 'Critical' || criticalMarket.severity === 'High' ? 'High' : 'Medium',
      category: 'Product Growth',
    });
  }

  const criticalTech = riskProfile.technicalRisks[0];
  if (criticalTech) {
    nextSteps.push({
      action: `Security / Architecture: ${criticalTech.mitigation}`,
      priority: criticalTech.severity === 'Critical' || criticalTech.severity === 'High' ? 'High' : 'Medium',
      category: 'Tech Stack',
    });
  }

  const criticalExecution = riskProfile.executionRisks[0];
  if (criticalExecution) {
    nextSteps.push({
      action: `Operational Setup: ${criticalExecution.mitigation}`,
      priority: criticalExecution.severity === 'Critical' || criticalExecution.severity === 'High' ? 'High' : 'Medium',
      category: 'Operations',
    });
  }

  // Fallbacks if list is too short
  if (nextSteps.length < 3) {
    nextSteps.push({
      action: `Pricing verification: Launch survey to confirm willingness to pay ${entryTier?.pricePoint || '$49/month'}.`,
      priority: 'Medium',
      category: 'Business Development',
    });
  }

  return {
    executiveSummary,
    scores: {
      overall,
      idea: ideaScore,
      market: marketScore,
      competition: competitionScore,
      businessModel: businessModelScore,
      risk: riskScore,
    },
    swot,
    recommendedMvp,
    nextSteps,
  };
}
