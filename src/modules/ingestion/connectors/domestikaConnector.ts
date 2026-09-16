import { RawIngestedJob } from "./greenhouseConnector";

/**
 * Conector para Domestika Jobs.
 * Rastrea vacantes frontend y diseño interactivo en España y LATAM.
 */
export async function fetchDomestikaJobs(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];

  try {
    const url = "https://www.domestika.org/es/jobs/category/11-programacion";
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    // Extraer enlaces a ofertas
    const regex = /<a[^>]*href="(\/es\/jobs\/\d+[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    const seen = new Set<string>();

    while ((match = regex.exec(html)) !== null) {
      const href = match[1];
      const innerText = match[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");

      const lower = innerText.toLowerCase();
      if (
        lower.includes("frontend") ||
        lower.includes("front-end") ||
        lower.includes("react") ||
        lower.includes("angular") ||
        lower.includes("web") ||
        lower.includes("javascript")
      ) {
        const fullUrl = `https://www.domestika.org${href}`;
        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);

        jobs.push({
          externalId: `domestika-${href.replace(/[^0-9]/g, "")}`,
          title: innerText,
          company: "Empresa en Domestika",
          location: "España / LATAM (Remoto)",
          sourceUrl: fullUrl,
          sourcePlatform: "Domestika",
          rawDescription: `Oferta de empleo de programación frontend en Domestika: ${innerText}. Enfoque UI/UX y tecnologías web modernas.`,
          companySlug: "domestika",
          regionHint: "SPAIN",
        });
      }
    }
  } catch (error) {
    console.error("Error al rastrear Domestika:", error);
  }

  return jobs.slice(0, 15);
}
