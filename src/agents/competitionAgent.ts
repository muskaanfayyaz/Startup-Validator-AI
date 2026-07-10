/**
 * competitionAgent.ts
 * Maps competitive threats, identifies direct/indirect players,
 * and evaluates differentiation vectors.
 * Runs in PARALLEL with marketAgent (Step 2 of the DAG).
 */

import { runAgent }               from '../lib/agentRunner';
import { buildCompetitionPrompt } from '../prompts/competitionPrompt';
import { assertString, assertObject, assertArray, assertNumber } from '../lib/validation';
import type { CompetitionAgentInput, CompetitiveLandscape } from '../types/report';

/**
 * Validates the raw JSON payload parsed from the LLM.
 */
function validate(data: any): CompetitiveLandscape {
  const root = assertObject(data, 'CompetitiveLandscape');

  // Validate directCompetitors (expect at least 2)
  const directCompetitors = assertArray(root.directCompetitors, 'directCompetitors', (comp, i) => {
    const obj = assertObject(comp, `directCompetitors[${i}]`);
    const name = assertString(obj.name, `directCompetitors[${i}].name`);
    const strengths = assertArray(obj.strengths, `directCompetitors[${i}].strengths`, (s, idx) => assertString(s, `directCompetitors[${i}].strengths[${idx}]`));
    const weaknesses = assertArray(obj.weaknesses, `directCompetitors[${i}].weaknesses`, (w, idx) => assertString(w, `directCompetitors[${i}].weaknesses[${idx}]`));
    return { name, strengths, weaknesses };
  });

  if (directCompetitors.length < 2) {
    throw new Error('Validation Error: Competition Agent must return at least 2 direct competitors.');
  }

  // Validate indirectCompetitors (expect at least 2)
  const indirectCompetitors = assertArray(root.indirectCompetitors, 'indirectCompetitors', (comp, i) => {
    const obj = assertObject(comp, `indirectCompetitors[${i}]`);
    const name = assertString(obj.name, `indirectCompetitors[${i}].name`);
    const alternativeMethod = assertString(obj.alternativeMethod, `indirectCompetitors[${i}].alternativeMethod`);
    return { name, alternativeMethod };
  });

  if (indirectCompetitors.length < 2) {
    throw new Error('Validation Error: Competition Agent must return at least 2 indirect competitors.');
  }

  // Validate differentiation
  const diff = assertObject(root.differentiation, 'differentiation');
  const vectors = assertArray(diff.vectors, 'differentiation.vectors', (vec, i) => assertString(vec, `differentiation.vectors[${i}]`));
  const rawScore = assertNumber(diff.differentiationScore, 'differentiation.differentiationScore');
  const differentiationScore = Math.max(1, Math.min(10, Math.round(rawScore)));

  return {
    directCompetitors,
    indirectCompetitors,
    differentiation: { vectors, differentiationScore }
  };
}

/**
 * Runs the Competition Agent with secure validation assertions.
 */
export async function runCompetitionAgent(
  input: CompetitionAgentInput
): Promise<CompetitiveLandscape> {
  return runAgent<CompetitionAgentInput, CompetitiveLandscape>(input, buildCompetitionPrompt, validate, 0.3);
}
