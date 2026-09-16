import { GoogleGenAI } from "@google/genai";

let geminiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY no está configurada en las variables de entorno (.env.local)");
    }
    geminiInstance = new GoogleGenAI({ apiKey });
  }
  return geminiInstance;
}
