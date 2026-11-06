import "server-only";
import { google } from "@ai-sdk/google";

// The main model can be changed with GEMINI_MODEL; the fallback is tried when the main one is busy or slow.
const MAIN = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";
const FALLBACK = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 20_000;

type Call = { model: ReturnType<typeof google>; abortSignal: AbortSignal; maxRetries: number };

export async function withModel<T>(run: (call: Call) => Promise<T>): Promise<T> {
  try {
    return await run({ model: google(MAIN), abortSignal: AbortSignal.timeout(TIMEOUT_MS), maxRetries: 1 });
  } catch (error) {
    if (MAIN === FALLBACK) throw error;
    return run({ model: google(FALLBACK), abortSignal: AbortSignal.timeout(TIMEOUT_MS), maxRetries: 1 });
  }
}

export const RULES =
  "You are Hapi, a study-abroad helper for students. Only use facts given to you or found in the sources. Never invent requirements, prices, dates or eligibility. If something is unknown, say it is unknown. Write short, plain English.";
