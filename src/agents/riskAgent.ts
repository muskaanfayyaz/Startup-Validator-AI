/**
 * riskAgent.ts
 * Adversarial stress-test across Technical, Market, Execution, and Legal vectors.
 * Runs LAST (Step 4 of the DAG) — consumes all preceding agent outputs.
 */

import { runAgent }        from '../lib/agentRunner';
import { buildRiskPrompt } from '../prompts/riskPrompt';
import { assertString, assertObject, assertArray, assertEnum } from '../lib/validation';
import type { RiskAgentInput, RiskProfile, RiskSeverity, RiskItem } from '../types/report';

/**
 * Validates a list of risk items for a specific category.
 */
function validateRiskList(list: any, categoryName: string): RiskItem[] {
  const severities: RiskSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
  return assertArray(list, categoryName, (item, i) => {
    const obj = assertObject(item, `${categoryName}[${i}]`);
    const risk = assertString(obj.risk, `${categoryName}[${i}].risk`);
    const severity = assertEnum<RiskSeverity>(obj.severity, severities, `${categoryName}[${i}].severity`);
    const mitigation = assertString(obj.mitigation, `${categoryName}[${i}].mitigation`);
    return { risk, severity, mitigation };
  });
}

/**
 * Validates the raw JSON payload parsed from the LLM.
 */
function validate(data: any): RiskProfile {
  const root = assertObject(data, 'RiskProfile');
  
  const technicalRisks = validateRiskList(root.technicalRisks, 'technicalRisks');
  const marketRisks = validateRiskList(root.marketRisks, 'marketRisks');
  const executionRisks = validateRiskList(root.executionRisks, 'executionRisks');
  const legalRisks = validateRiskList(root.legalRisks, 'legalRisks');

  return {
    technicalRisks,
    marketRisks,
    executionRisks,
    legalRisks
  };
}

/**
 * Runs the Risk Agent with secure validation assertions.
 */
export async function runRiskAgent(
  input: RiskAgentInput
): Promise<RiskProfile> {
  return runAgent<RiskAgentInput, RiskProfile>(input, buildRiskPrompt, validate, 0.3);
}
