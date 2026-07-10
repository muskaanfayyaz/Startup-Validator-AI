/**
 * jsonParser.ts
 * Robust JSON extractor for LLM responses.
 * Handles: raw JSON, markdown fences (```json...```), and partial wrapping.
 */

export class ParseError extends Error {
  rawText: string;

  constructor(message: string, rawText: string) {
    super(message);
    this.name = 'ParseError';
    this.rawText = rawText;
  }
}

/**
 * Extracts and parses a JSON object from a raw LLM response string.
 * Since we use responseMimeType: 'application/json', this is usually a
 * pass-through — but the fence-stripping guards against any edge cases.
 */
export function extractJSON<T>(rawText: string): T {
  let text = rawText.trim();

  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }

  // Find the first '{' or '[' to trim any leading prose
  const firstBrace = text.search(/[{[]/);
  if (firstBrace > 0) {
    text = text.slice(firstBrace);
  }

  try {
    return JSON.parse(text) as T;
  } catch (cause) {
    throw new ParseError(
      `Failed to parse JSON from LLM response: ${(cause as Error).message}`,
      rawText
    );
  }
}
