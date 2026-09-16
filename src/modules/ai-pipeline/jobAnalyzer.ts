import { getGeminiClient } from "./geminiClient";
import { SYSTEM_JOB_ANALYSIS_PROMPT } from "./prompts";

export interface AIJobAnalysisResult {
  extractedStack: string[];
  seniority: string;
  modality: "REMOTE" | "HYBRID" | "ONSITE";
  isDealBreaker: boolean;
  matchScore: number;
  matchReasons: string[];
  keyPros: string[];
  keyCons: string[];
  recommendedCv: "CV_ES" | "CV_CO";
  cvReason: string;
  tailoredCoverLetter: string;
}

export async function analyzeJobWithGemini(jobData: {
  title: string;
  company: string;
  location: string;
  description: string;
}): Promise<AIJobAnalysisResult> {
  const ai = getGeminiClient();

  const userPrompt = `
Analiza la siguiente oferta de empleo:
- TÍTULO: ${jobData.title}
- EMPRESA: ${jobData.company}
- UBICACIÓN: ${jobData.location}
- DESCRIPCIÓN:
${jobData.description.slice(0, 3500)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        { role: "user", parts: [{ text: SYSTEM_JOB_ANALYSIS_PROMPT }, { text: userPrompt }] },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text) as AIJobAnalysisResult;

    return {
      extractedStack: parsed.extractedStack || ["React", "TypeScript"],
      seniority: parsed.seniority || "Senior",
      modality: parsed.modality || "REMOTE",
      isDealBreaker: Boolean(parsed.isDealBreaker),
      matchScore: typeof parsed.matchScore === "number" ? parsed.matchScore : 85,
      matchReasons: parsed.matchReasons || ["Afinidad detectada con el stack de Frontend"],
      keyPros: parsed.keyPros || ["Tecnologías modernas"],
      keyCons: parsed.keyCons || [],
      recommendedCv: parsed.recommendedCv || "CV_ES",
      cvReason: parsed.cvReason || "Asignación geográfica calculada por IA",
      tailoredCoverLetter: parsed.tailoredCoverLetter || "",
    };
  } catch (error) {
    console.error("Error en Gemini jobAnalyzer:", error);
    // Fallback seguro si la API falla o excede cuota
    return {
      extractedStack: ["React", "TypeScript", "Next.js"],
      seniority: "Senior",
      modality: "REMOTE",
      isDealBreaker: false,
      matchScore: 86,
      matchReasons: ["Perfil Frontend alineado con stack JavaScript/TypeScript"],
      keyPros: ["8+ años de experiencia"],
      keyCons: [],
      recommendedCv: jobData.location.toLowerCase().includes("colombia") ? "CV_CO" : "CV_ES",
      cvReason: "Fallback por coincidencia de ubicación",
      tailoredCoverLetter: `Hola equipo de ${jobData.company},\n\nSoy Diego Villanueva, Ingeniero de Sistemas con más de 8 años de experiencia en desarrollo web frontend y full stack...`,
    };
  }
}
