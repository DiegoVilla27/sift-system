import { CVId, TargetRegion } from "@/shared/types";
import { CV_PROFILES } from "./cvProfiles";
import { DispatchResult } from "./types";

interface JobInspectionInput {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  currency?: string;
}

/**
 * Motor de despacho regional de CV determinista de alta precisión.
 * Diseñado con tolerancia cero a errores entre CV España y CV Colombia.
 */
export function dispatchCv(job: JobInspectionInput): DispatchResult {
  const fullText = [
    job.title || "",
    job.company || "",
    job.location || "",
    job.description || "",
    job.currency || "",
  ]
    .join(" ")
    .toLowerCase();

  const esKeywords = CV_PROFILES.CV_ES.matchKeywords;
  const coKeywords = CV_PROFILES.CV_CO.matchKeywords;

  const matchedEs = esKeywords.filter((kw) => fullText.includes(kw));
  const matchedCo = coKeywords.filter((kw) => fullText.includes(kw));

  // Prioridad 1: Ubicación explícita y ciudades
  const esLocationMatches = ["españa", "spain", "madrid", "barcelona", "valencia", "málaga", "sevilla", "bilbao"].filter(
    (loc) => (job.location || "").toLowerCase().includes(loc)
  );

  const coLocationMatches = ["colombia", "bogotá", "bogota", "medellín", "medellin", "cali", "barranquilla", "latam"].filter(
    (loc) => (job.location || "").toLowerCase().includes(loc)
  );

  if (esLocationMatches.length > 0) {
    return {
      assignedCvId: "CV_ES",
      targetRegion: "SPAIN",
      confidence: 1.0,
      reason: `Ubicación explícita en España detectada: "${esLocationMatches.join(", ")}"`,
      matchedRules: esLocationMatches,
      isQuarantined: false,
    };
  }

  if (coLocationMatches.length > 0) {
    return {
      assignedCvId: "CV_CO",
      targetRegion: "LATAM",
      confidence: 1.0,
      reason: `Ubicación explícita en Colombia/LATAM detectada: "${coLocationMatches.join(", ")}"`,
      matchedRules: coLocationMatches,
      isQuarantined: false,
    };
  }

  // Prioridad 2: Moneda y requisitos legales
  if (job.currency === "EUR" || fullText.includes("eur") || fullText.includes("€") || fullText.includes("dni") || fullText.includes("nie")) {
    return {
      assignedCvId: "CV_ES",
      targetRegion: "SPAIN",
      confidence: 0.98,
      reason: "Moneda en Euros (€) o mención de DNI/NIE/marco legal español detectado.",
      matchedRules: ["EUR/€", "Marco legal español"],
      isQuarantined: false,
    };
  }

  if (job.currency === "COP" || fullText.includes("cop") || fullText.includes("cédula") || fullText.includes("prestación de servicios")) {
    return {
      assignedCvId: "CV_CO",
      targetRegion: "LATAM",
      confidence: 0.98,
      reason: "Moneda en COP o mención de marco contractual colombiano detectado.",
      matchedRules: ["COP", "Contrato LATAM"],
      isQuarantined: false,
    };
  }

  // Prioridad 3: Balance de palabras clave generales
  if (matchedEs.length > matchedCo.length) {
    return {
      assignedCvId: "CV_ES",
      targetRegion: "SPAIN",
      confidence: 0.92,
      reason: `Mayor densidad de criterios españoles (${matchedEs.slice(0, 3).join(", ")})`,
      matchedRules: matchedEs,
      isQuarantined: false,
    };
  }

  if (matchedCo.length > matchedEs.length) {
    return {
      assignedCvId: "CV_CO",
      targetRegion: "LATAM",
      confidence: 0.92,
      reason: `Mayor densidad de criterios LATAM (${matchedCo.slice(0, 3).join(", ")})`,
      matchedRules: matchedCo,
      isQuarantined: false,
    };
  }

  // Zona Gris: Si es 100% Remoto sin detalles geográficos, default seguro con alerta
  return {
    assignedCvId: "CV_ES", // Default de contingencia si no hay indicadores
    targetRegion: "UNKNOWN",
    confidence: 0.70,
    reason: "Oferta remota sin localización específica clara. Se sugiere verificación antes de postular.",
    matchedRules: ["Regla de contingencia"],
    isQuarantined: true,
  };
}
