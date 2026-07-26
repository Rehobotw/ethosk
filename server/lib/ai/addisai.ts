import type { TargetLanguage } from "@shared/types.js";
import { env } from "../../env.js";
import { AiUnavailableError, callWithRetry, claudeText, MODELS } from "./index.js";
import { translationFallbackSystem } from "./prompts.js";

const TIMEOUT_MS = 8_000;

export function isAddisAiConfigured(): boolean {
  return Boolean(env.addisAiApiKey);
}

/**
 * Translates one string via Addis AI, the Ethiopian-language provider.
 *
 * Falls back to Claude if Addis AI is unreachable. The fallback is noted in the
 * server log rather than surfaced to the researcher as a caveat, since the
 * result is still usable (§7.1).
 */
export async function translateText(
  text: string,
  targetLanguage: TargetLanguage,
): Promise<{ text: string; provider: "addis_ai" | "claude_fallback" }> {
  if (env.addisAiApiKey) {
    try {
      const translated = await callWithRetry(() => requestAddisAi(text, targetLanguage));
      return { text: translated, provider: "addis_ai" };
    } catch (error) {
      console.warn(
        `[addisai] translation to ${targetLanguage} failed, falling back to Claude:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  const fallback = await claudeText({
    model: MODELS.sonnet,
    system: translationFallbackSystem(targetLanguage),
    user: text,
    maxTokens: 300,
    temperature: 0.3,
    timeoutMs: TIMEOUT_MS,
  });
  return { text: fallback, provider: "claude_fallback" };
}

async function requestAddisAi(text: string, targetLanguage: TargetLanguage): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${env.addisAiBaseUrl}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.addisAiApiKey}`,
      },
      body: JSON.stringify({
        text,
        source_language: "en",
        target_language: targetLanguage,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AiUnavailableError(`Addis AI responded ${response.status}`);
    }

    const payload = (await response.json()) as {
      translation?: string;
      translated_text?: string;
      data?: { translation?: string };
    };
    const translated = payload.translation ?? payload.translated_text ?? payload.data?.translation;
    if (!translated) throw new AiUnavailableError("Addis AI returned no translation");
    return translated.trim();
  } finally {
    clearTimeout(timer);
  }
}
