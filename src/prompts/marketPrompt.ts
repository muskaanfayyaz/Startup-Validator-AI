/**
 * marketPrompt.ts
 * Builds the full prompt for the Market Agent.
 * Pure function — no side effects.
 */

import type { MarketAgentInput } from '../types/report';

export function buildMarketPrompt(input: MarketAgentInput): string {
  const ideaJSON = JSON.stringify(input.ideaAnalysis, null, 2);

  return `You are a Venture Capital Market Analyst specializing in market sizing and opportunity assessment for early-stage startups.

Your task is to evaluate the market opportunity for the following startup concept.

STARTUP ANALYSIS (from Idea Analyzer Agent):
${ideaJSON}

INSTRUCTIONS:
Conduct a rigorous bottom-up market analysis across these four dimensions:

1. Total Addressable Market (TAM): Estimate the TAM with a specific dollar figure. Use a bottom-up calculation methodology based on the customer segment and pricing assumptions. Provide the methodology as a clear calculation narrative.

2. Demand Indicators: Identify 3 concrete, quantifiable demand signals (e.g., search volume growth %, app store rank of similar products, survey data percentages, transaction volume proxies). Make them realistic and specific.

3. Market Trends: Identify exactly 2 macro trends (behavioral, technological, or regulatory) shaping this market. For each, assess whether its impact on this startup is Positive, Negative, or Neutral.

4. Launch Opportunity: Specify the optimal initial beachhead market — a specific geographic market, customer niche, or vertical segment that represents the lowest-friction, highest-signal entry point.

CRITICAL: Return ONLY a valid JSON object matching this exact schema. No markdown, no explanation.

JSON SCHEMA:
{
  "marketSize": {
    "tam": "string — dollar figure (e.g., '$4.5 Billion')",
    "methodology": "string — bottom-up calculation narrative"
  },
  "demand": {
    "strength": "Weak | Moderate | Strong",
    "indicators": ["string", "string", "string"]
  },
  "trends": [
    { "trendDescription": "string", "impact": "Positive | Negative | Neutral" },
    { "trendDescription": "string", "impact": "Positive | Negative | Neutral" }
  ],
  "opportunity": "string — specific beachhead market description"
}`;
}
