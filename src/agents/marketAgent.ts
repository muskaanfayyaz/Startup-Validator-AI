/**
 * marketAgent.ts
 * Evaluates macroeconomic signals, demand indicators, trends, and TAM.
 * Runs in PARALLEL with competitionAgent (Step 2 of the DAG).
 */

import { runAgent }          from '../lib/agentRunner';
import { buildMarketPrompt } from '../prompts/marketPrompt';
import { assertString, assertObject, assertArray, assertEnum } from '../lib/validation';
import type { MarketAgentInput, MarketFeasibility, DemandStrength, TrendImpact } from '../types/report';

/**
 * Validates the raw JSON payload parsed from the LLM.
 */
function validate(data: any): MarketFeasibility {
  const root = assertObject(data, 'MarketFeasibility');

  const marketSize = assertObject(root.marketSize, 'marketSize');
  const tam = assertString(marketSize.tam, 'marketSize.tam');
  const methodology = assertString(marketSize.methodology, 'marketSize.methodology');

  const demand = assertObject(root.demand, 'demand');
  const indicators = assertArray(demand.indicators, 'demand.indicators', (ind, i) => assertString(ind, `demand.indicators[${i}]`));
  const strength = assertEnum<DemandStrength>(demand.strength, ['Weak', 'Moderate', 'Strong'], 'demand.strength');

  const trends = assertArray(root.trends, 'trends', (item, idx) => {
    const trendObj = assertObject(item, `trends[${idx}]`);
    return {
      trendDescription: assertString(trendObj.trendDescription, `trends[${idx}].trendDescription`),
      impact: assertEnum<TrendImpact>(trendObj.impact, ['Positive', 'Negative', 'Neutral'], `trends[${idx}].impact`)
    };
  });

  const opportunity = assertString(root.opportunity, 'opportunity');

  return {
    marketSize: { tam, methodology },
    demand: { indicators, strength },
    trends,
    opportunity
  };
}

/**
 * Runs the Market Agent with secure validation assertions.
 */
export async function runMarketAgent(
  input: MarketAgentInput
): Promise<MarketFeasibility> {
  return runAgent<MarketAgentInput, MarketFeasibility>(input, buildMarketPrompt, validate, 0.4);
}
