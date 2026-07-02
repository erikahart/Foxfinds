import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

/** Lazily-constructed server-only Anthropic client. */
export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export const VISION_MODEL = "claude-sonnet-4-6";

/** Pull the first {...} JSON object out of a model reply and parse it. */
export function extractJSON<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model output");
  return JSON.parse(text.slice(start, end + 1)) as T;
}
