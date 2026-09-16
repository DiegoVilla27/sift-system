/**
 * Filtro estricto de idioma para garantizar que 100% de las ofertas sean en Español
 * y no requieran inglés fluido/avanzado (requisito explícito del candidato).
 */

const COMMON_SPANISH_WORDS = [
  " de ",
  " en ",
  " y ",
  " para ",
  " con ",
  " los ",
  " las ",
  " una ",
  " por ",
  " como ",
  " requisitos ",
  " experiencia ",
  " funciones ",
  " desarrollo ",
  " empresa ",
  " buscamos ",
  " equipo ",
  " trabajo ",
  " remoto ",
  " contrato ",
  " salario ",
  " vacante ",
  " puesto ",
  " conocimientos ",
  " jornada ",
];

const ENGLISH_DEALBREAKER_PHRASES = [
  "fluent in english",
  "fluent english",
  "english is a must",
  "advanced english",
  "native english",
  "c1 english",
  "c2 english",
  "english proficiency",
  "working proficiency in english",
  "ingles fluido",
  "inglés fluido",
  "inglés avanzado",
  "ingles avanzado",
  "nivel de inglés: alto",
  "nivel de ingles: alto",
  "nivel de inglés c1",
  "nivel de ingles c1",
  "imprescindible inglés alto",
  "imprescindible ingles alto",
];

export function isSpanishJob(title: string, description: string): {
  isSpanish: boolean;
  hasEnglishDealBreaker: boolean;
  reason?: string;
} {
  const combined = ` ${title} ${description} `.toLowerCase();

  // 1. Verificar si exige inglés fluido/avanzado (deal-breaker)
  for (const phrase of ENGLISH_DEALBREAKER_PHRASES) {
    if (combined.includes(phrase)) {
      return {
        isSpanish: false,
        hasEnglishDealBreaker: true,
        reason: `Exige idioma inglés obligatorio ("${phrase}"). Candidato requiere ofertas en español.`,
      };
    }
  }

  // 2. Comprobar si la descripción está redactada en español
  let spanishWordHits = 0;
  for (const word of COMMON_SPANISH_WORDS) {
    if (combined.includes(word)) {
      spanishWordHits++;
    }
  }

  // Si tiene al menos 3 palabras funcionales en español, la consideramos en español
  const isSpanish = spanishWordHits >= 3;

  return {
    isSpanish,
    hasEnglishDealBreaker: !isSpanish,
    reason: isSpanish ? "Oferta redactada en español" : "Oferta redactada en inglés o idioma extranjero",
  };
}
