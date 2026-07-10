/**
 * competitionPrompt.ts
 * Builds the full prompt for the Competition Agent.
 * Pure function — no side effects.
 */

import type { CompetitionAgentInput } from '../types/report';

export function buildCompetitionPrompt(input: CompetitionAgentInput): string {
  const ideaJSON = JSON.stringify(input.ideaAnalysis, null, 2);

  return `You are a Competitive Intelligence Lead with deep expertise in startup competitive analysis, market mapping, and strategic positioning frameworks.

Your task is to map the competitive landscape for the following startup.

STARTUP ANALYSIS (from Idea Analyzer Agent):
${ideaJSON}

INSTRUCTIONS:
Conduct an objective competitive assessment across three dimensions:

1. Direct Competitors: Identify exactly 2 direct competitors — established brands or products solving the same problem for the same customer segment. For each, provide:
   - 3 genuine strengths (objective performance metrics, not marketing copy)
   - 3 real weaknesses (based on known user complaints, market gaps, or structural issues)

2. Indirect Competitors: Identify exactly 2 indirect alternatives — how the target customer currently solves this problem without using a dedicated product (e.g., using Excel, hiring a freelancer, doing nothing). Explain the alternative method clearly.

3. Differentiation Framework: Identify 3 specific product or business vectors where this new startup has a real, defensible advantage over the identified competitors. Assign a differentiation score from 1 (weak) to 10 (highly differentiated).

CRITICAL: Return ONLY a valid JSON object matching this exact schema. No markdown, no explanation.

JSON SCHEMA:
{
  "directCompetitors": [
    {
      "name": "string — real company or product name",
      "strengths": ["string", "string", "string"],
      "weaknesses": ["string", "string", "string"]
    },
    {
      "name": "string",
      "strengths": ["string", "string", "string"],
      "weaknesses": ["string", "string", "string"]
    }
  ],
  "indirectCompetitors": [
    { "name": "string", "alternativeMethod": "string — how they solve the problem" },
    { "name": "string", "alternativeMethod": "string" }
  ],
  "differentiation": {
    "vectors": ["string", "string", "string"],
    "differentiationScore": 1
  }
}`;
}
