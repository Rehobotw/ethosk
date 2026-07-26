import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../env.js";

const client = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

// Anthropic issues keys prefixed `sk-ant-`. A key of any other shape is almost
// always one copied from a different provider, which fails only at call time —
// and since every AI feature falls back silently, that failure looks like the
// feature simply doing nothing. Saying so at boot makes it diagnosable.
if (env.anthropicApiKey && !env.anthropicApiKey.startsWith("sk-ant-")) {
  console.warn(
    "[ai] ANTHROPIC_API_KEY does not look like an Anthropic key (expected an " +
      "sk-ant- prefix). Claude calls will fail and every AI feature will fall " +
      "back to its non-AI behaviour.",
  );
}

export function isClaudeConfigured(): boolean {
  return client !== null;
}

export class AiUnavailableError extends Error {
  constructor(message = "AI provider unavailable") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/**
 * Shared retry wrapper: one retry with exponential backoff, then rethrow so the
 * caller can apply its own feature-specific fallback (§7.4, §16.1).
 */
export async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export interface TextCallOptions {
  model: string;
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

/** Single-turn text completion returning the concatenated text blocks. */
export async function claudeText(options: TextCallOptions): Promise<string> {
  if (!client) throw new AiUnavailableError("ANTHROPIC_API_KEY is not configured");

  return callWithRetry(async () => {
    const message = await client.messages.create(
      {
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: options.system,
        messages: [{ role: "user", content: options.user }],
      },
      { timeout: options.timeoutMs },
    );
    return extractText(message);
  });
}

export interface ConversationOptions {
  model: string;
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export async function claudeConversation(options: ConversationOptions): Promise<string> {
  if (!client) throw new AiUnavailableError("ANTHROPIC_API_KEY is not configured");

  return callWithRetry(async () => {
    const message = await client.messages.create(
      {
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: options.system,
        messages: options.messages,
      },
      { timeout: options.timeoutMs },
    );
    return extractText(message);
  });
}

export interface ImageCallOptions extends Omit<TextCallOptions, "user"> {
  user: string;
  imageBase64: string;
  imageMediaType: "image/jpeg" | "image/png";
}

export async function claudeImage(options: ImageCallOptions): Promise<string> {
  if (!client) throw new AiUnavailableError("ANTHROPIC_API_KEY is not configured");

  return callWithRetry(async () => {
    const message = await client.messages.create(
      {
        model: options.model,
        max_tokens: options.maxTokens,
        temperature: options.temperature,
        system: options.system,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: options.imageMediaType,
                  data: options.imageBase64,
                },
              },
              { type: "text", text: options.user },
            ],
          },
        ],
      },
      { timeout: options.timeoutMs },
    );
    return extractText(message);
  });
}

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block): block is Anthropic.Messages.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/**
 * Extracts a JSON object or array from a model response that may have wrapped it
 * in prose or a fenced code block. Throws if nothing parseable is found — the
 * caller treats that identically to an API failure (§7.3).
 */
export function extractJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? raw).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start === -1 || end <= start) {
      throw new Error("Model response contained no parseable JSON");
    }
    return JSON.parse(candidate.slice(start, end + 1));
  }
}
