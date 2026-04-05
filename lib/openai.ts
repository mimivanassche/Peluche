const OPENAI_API_BASE = 'https://api.openai.com/v1';

export function getOpenAIKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment variables.');
  }

  return apiKey;
}

export function getTextModel() {
  return process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini';
}

export function getVisionModel() {
  return process.env.OPENAI_VISION_MODEL || process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini';
}

export function getImageModel() {
  return process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
}

export async function openaiRequest(path: string, body: unknown) {
  const response = await fetch(`${OPENAI_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getOpenAIKey()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI request failed.';
    throw new Error(message);
  }

  return data;
}

export function extractResponseText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data?.output)) {
    const parts: string[] = [];

    for (const item of data.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const contentItem of item.content) {
        if (typeof contentItem?.text === 'string') {
          parts.push(contentItem.text);
        }
      }
    }

    return parts.join('\n').trim();
  }

  return '';
}

function stripCodeFences(text: string) {
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function tryParseCandidate<T>(candidate: string): T | null {
  try {
    const parsed = JSON.parse(candidate);

    if (typeof parsed === 'string') {
      return tryParseCandidate<T>(parsed);
    }

    return parsed as T;
  } catch {
    return null;
  }
}

export function parseJsonFromModelText<T>(text: string): T {
  const cleaned = stripCodeFences(text);

  const direct = tryParseCandidate<T>(cleaned);
  if (direct) {
    return direct;
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('The model did not return valid JSON.');
  }

  const objectSlice = cleaned.slice(firstBrace, lastBrace + 1);

  const sliced = tryParseCandidate<T>(objectSlice);
  if (sliced) {
    return sliced;
  }

  const unescaped = objectSlice
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\"/g, '"');

  const repaired = tryParseCandidate<T>(unescaped);
  if (repaired) {
    return repaired;
  }

  throw new Error('The model returned JSON in an unexpected format. Please try again.');
}
