/**
 * ideaAnalyzerAgent.ts
 * Deconstructs the raw startup pitch into foundational product dimensions.
 */

import { runAgent }                from '../lib/agentRunner';
import { buildIdeaAnalyzerPrompt }  from '../prompts/ideaAnalyzerPrompt';
import { assertString, assertObject, assertArray, assertEnum } from '../lib/validation';
import type { IdeaAnalyzerInput, IdeaAnalysis, ProblemSeverity } from '../types/report';

/**
 * Validates the raw JSON payload parsed from the LLM.
 */
function validate(data: any): IdeaAnalysis {
  const root = assertObject(data, 'IdeaAnalysis');
  
  const customer = assertObject(root.customer, 'customer');
  const primarySegment = assertString(customer.primarySegment, 'customer.primarySegment');
  const painPoints = assertArray(customer.painPoints, 'customer.painPoints', (p, i) => assertString(p, `customer.painPoints[${i}]`));

  const problem = assertObject(root.problem, 'problem');
  const statement = assertString(problem.statement, 'problem.statement');
  const severity = assertEnum<ProblemSeverity>(problem.severity, ['Low', 'Medium', 'High', 'Critical'], 'problem.severity');

  const uniqueness = assertObject(root.uniqueness, 'uniqueness');
  const coreDifferentiator = assertString(uniqueness.coreDifferentiator, 'uniqueness.coreDifferentiator');
  const valueProposition = assertString(uniqueness.valueProposition, 'uniqueness.valueProposition');

  return {
    startupCategory: assertString(root.startupCategory, 'startupCategory'),
    customer: { primarySegment, painPoints },
    problem: { statement, severity },
    uniqueness: { coreDifferentiator, valueProposition }
  };
}

/**
 * Runs the Idea Analyzer Agent with secure validation assertions.
 */
export async function runIdeaAnalyzerAgent(
  input: IdeaAnalyzerInput
): Promise<IdeaAnalysis> {
  return runAgent<IdeaAnalyzerInput, IdeaAnalysis>(input, buildIdeaAnalyzerPrompt, validate, 0.3);
}
