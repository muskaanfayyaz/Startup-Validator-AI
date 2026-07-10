/**
 * agentRunner.ts
 * Reusable wrapper to run any AI Agent in the pipeline.
 * Encapsulates the execution logic: prompt creation, Gemini invocation,
 * JSON extraction, and runtime schema validation.
 */

import { callGemini }  from './geminiClient';
import { extractJSON } from './jsonParser';

/**
 * Executes a specialized AI Agent with strict typing, prompt mapping,
 * and custom output validation.
 *
 * @param input        - Structured input payload for the agent
 * @param buildPrompt  - Pure function compiling input to a system/user prompt
 * @param validate     - Assertion block verifying the returned JSON structure
 * @param temperature  - Sampling parameter for LLM creativity
 */
export async function runAgent<TInput, TOutput>(
  input: TInput,
  buildPrompt: (input: TInput) => string,
  validate: (data: any) => TOutput,
  temperature = 0.3
): Promise<TOutput> {
  const prompt  = buildPrompt(input);
  const rawText = await callGemini(prompt, temperature);
  const parsed  = extractJSON<any>(rawText);
  return validate(parsed);
}
