// Gemini client shared by the API. Model picked in build step 1
// (`bun run check:gemini`, 10 Oct 2026): gemini-3.5-flash-lite read an official
// pricing page with the URL context tool and returned valid JSON in about 2s.
// gemini-3.8-flash also works but took about 25s and often returned 503
// "high demand", so it is only the backup.
import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

export const MODEL = "gemini-3.5-flash-lite";
export const BACKUP_MODEL = "gemini-3.8-flash";

let client: GoogleGenAI | undefined;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function isBusy(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("503") || msg.includes("UNAVAILABLE");
}

export function isQuotaError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED");
}

// Calls MODEL, and retries once on BACKUP_MODEL if Gemini says it is busy.
export async function generate(params: Omit<GenerateContentParameters, "model">) {
  try {
    return await getClient().models.generateContent({ ...params, model: MODEL });
  } catch (err) {
    if (!isBusy(err)) throw err;
    return await getClient().models.generateContent({ ...params, model: BACKUP_MODEL });
  }
}
