/**
 * businessModelAgent.ts
 * Formulates pricing tiers, monetization mechanics, and secondary revenue streams.
 * Runs AFTER market + competition agents complete (Step 3 of the DAG).
 */

import { runAgent }                  from '../lib/agentRunner';
import { buildBusinessModelPrompt }  from '../prompts/businessModelPrompt';
import { assertString, assertObject, assertArray } from '../lib/validation';
import type { BusinessModelAgentInput, BusinessModel } from '../types/report';

/**
 * Validates the raw JSON payload parsed from the LLM.
 */
function validate(data: any): BusinessModel {
  const root = assertObject(data, 'BusinessModel');

  // Validate pricing details
  const pricing = assertObject(root.pricing, 'pricing');
  const structure = assertString(pricing.structure, 'pricing.structure');
  const suggestedTiers = assertArray(pricing.suggestedTiers, 'pricing.suggestedTiers', (tier, i) => {
    const obj = assertObject(tier, `pricing.suggestedTiers[${i}]`);
    const tierName = assertString(obj.tierName, `pricing.suggestedTiers[${i}].tierName`);
    const pricePoint = assertString(obj.pricePoint, `pricing.suggestedTiers[${i}].pricePoint`);
    const featuresIncluded = assertArray(obj.featuresIncluded, `pricing.suggestedTiers[${i}].featuresIncluded`, (f, idx) => assertString(f, `pricing.suggestedTiers[${i}].featuresIncluded[${idx}]`));
    return { tierName, pricePoint, featuresIncluded };
  });

  // Validate monetization description
  const monetization = assertString(root.monetization, 'monetization');

  // Validate revenue streams
  const revenueStreams = assertArray(root.revenueStreams, 'revenueStreams', (stream, i) => {
    const obj = assertObject(stream, `revenueStreams[${i}]`);
    const source = assertString(obj.source, `revenueStreams[${i}].source`);
    const description = assertString(obj.description, `revenueStreams[${i}].description`);
    return { source, description };
  });

  return {
    pricing: { structure, suggestedTiers },
    monetization,
    revenueStreams
  };
}

/**
 * Runs the Business Model Agent with secure validation assertions.
 */
export async function runBusinessModelAgent(
  input: BusinessModelAgentInput
): Promise<BusinessModel> {
  return runAgent<BusinessModelAgentInput, BusinessModel>(input, buildBusinessModelPrompt, validate, 0.35);
}
