/**
 * TODO:
 * - Verify active Gemini model ID
 * - Add retry logic for 429 errors
 * - Add fallback model support
 * - Add JSON repair mechanism
 */
// src/services/boardroomService.ts

import { GoogleGenAI } from "@google/genai";
import { validateBoardroomResponse } from "../ai/validator";
import { generateBoardroomPrompt } from "../prompts/boardroomPrompt";

import { StartupInput, BoardroomResponse } from "../types/boardroom";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// Try the primary model first; fall back to a cheaper/more available one
// if the primary is rate-limited or briefly unavailable.
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

const MAX_RETRIES_PER_MODEL = 2;
const BASE_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("503") ||
    message.includes("UNAVAILABLE")
  );
}

async function callGeminiWithRetry(prompt: string): Promise<string> {
  let lastError: unknown;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const rawText = response.text;
        if (!rawText) {
          throw new Error(`${model} returned an empty response.`);
        }

        return rawText;
      } catch (error) {
        lastError = error;

        const canRetry =
          isRetryable(error) && attempt < MAX_RETRIES_PER_MODEL;

        if (!canRetry) break; // move to next model (or give up if none left)

        const delay = BASE_DELAY_MS * 2 ** attempt;
        console.warn(
          `Gemini call failed on ${model} (attempt ${attempt + 1}), retrying in ${delay}ms`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All Gemini models failed.");
}

export async function analyzeStartup(
  startup: StartupInput
): Promise<BoardroomResponse> {
  try {
    const prompt = generateBoardroomPrompt(startup);
    const rawText = await callGeminiWithRetry(prompt);

    const cleanedResponse = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed: BoardroomResponse = JSON.parse(cleanedResponse);

    if (!validateBoardroomResponse(parsed)) {
      throw new Error("Invalid Boardroom response structure.");
    }

    return {
      ...parsed,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Boardroom AI Error:", error);
    throw new Error("Failed to generate boardroom analysis.");
  }
}
