/**
 * businessModelPrompt.ts
 * Builds the full prompt for the Business Model Agent.
 * Pure function — no side effects.
 */

import type { BusinessModelAgentInput } from '../types/report';

export function buildBusinessModelPrompt(input: BusinessModelAgentInput): string {
  const ideaJSON    = JSON.stringify(input.ideaAnalysis, null, 2);
  const marketJSON  = JSON.stringify(input.marketFeasibility, null, 2);
  const compJSON    = JSON.stringify(input.competitiveLandscape, null, 2);

  return `You are a Principal VC Pricing Consultant and Revenue Strategy expert. You have structured monetization models for 200+ funded startups across B2B SaaS, Marketplace, FinTech, and Consumer verticals.

Your task is to design the optimal monetization model for this startup.

STARTUP ANALYSIS:
${ideaJSON}

MARKET ANALYSIS:
${marketJSON}

COMPETITIVE LANDSCAPE:
${compJSON}

INSTRUCTIONS:
Design a complete, implementable monetization architecture:

1. Pricing Structure: Define the pricing model type (subscription tiers, transactional commission, freemium, usage-based). Propose 2–3 specific pricing tiers with real dollar amounts and billing frequencies aligned with market benchmarks and competitor take rates.

2. Core Monetization: Clearly define the primary value capture mechanism — how the business earns money on each transaction or customer relationship.

3. Revenue Stream Diversification: Design 2–3 secondary revenue streams beyond the primary model. Each should be a realistic, actionable expansion of the core business (e.g., API licensing, data insights, white-labeling, premium add-ons). Provide the source name and a clear description.

Ensure pricing is calibrated against competitor margins identified in the competitive landscape. Align revenue streams to scale naturally as the user base grows.

CRITICAL: Return ONLY a valid JSON object matching this exact schema. No markdown, no explanation.

JSON SCHEMA:
{
  "pricing": {
    "structure": "string — pricing model description",
    "suggestedTiers": [
      {
        "tierName": "string",
        "pricePoint": "string — e.g., '$49/month' or '15% take rate'",
        "featuresIncluded": ["string", "string", "string"]
      }
    ]
  },
  "monetization": "string — primary value capture mechanism",
  "revenueStreams": [
    { "source": "string — stream name", "description": "string — how it generates revenue" },
    { "source": "string", "description": "string" }
  ]
}`;
}
