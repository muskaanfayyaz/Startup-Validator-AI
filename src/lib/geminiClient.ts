/**
 * geminiClient.ts
 * Core Gemini API client using standard HTTP fetch.
 * Supports both Google AI Studio (generativelanguage.googleapis.com) and
 * Vertex AI (aiplatform.googleapis.com) REST endpoints to handle standard
 * developer keys and GCP-scoped keys.
 */

const MODEL = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.0-flash';

/**
 * Calls the Gemini API via AI Studio or Vertex AI depending on config.
 */
export async function callGemini(
  prompt: string,
  temperature = 0.3
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY is not set. Please create a .env file in the project root with a valid Gemini API key.'
    );
  }

  const projectId = import.meta.env.VITE_GCP_PROJECT_ID as string | undefined;
  const location = import.meta.env.VITE_GCP_LOCATION as string | undefined || 'us-central1';

  let url = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (projectId && projectId.trim()) {
    // ─── VERTEX AI MODE (GCP) ───
    // Direct Vertex AI REST endpoint supporting GCP API keys via query param
    url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${MODEL}:generateContent?key=${apiKey}`;
  } else {
    // ─── AI STUDIO MODE ───
    url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    headers['x-goog-api-key'] = apiKey;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorBody);
    } catch {
      parsedError = { error: { message: errorBody } };
    }
    const message = parsedError.error?.message || parsedError.error?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini API Error: ${message}`);
  }

  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API returned an empty model output.');
  }

  return text;
}
