import "server-only";
import { google } from "@ai-sdk/google";

// The main model can be changed with GEMINI_MODEL; the fallback is tried when the main one is busy.
const MAIN = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
const FALLBACK = "gemini-flash-lite-latest";

export async function withModel<T>(run: (model: ReturnType<typeof google>) => Promise<T>): Promise<T> {
  try {
    return await run(google(MAIN));
  } catch (error) {
    if (MAIN === FALLBACK) throw error;
    return run(google(FALLBACK));
  }
}

export const RULES =
  "You are Hapi, a study-abroad helper for students. Only use facts given to you or found in the sources. Never invent requirements, prices, dates or eligibility. If something is unknown, say it is unknown. Write short, plain English.";
