import { RawIngestedJob } from "./greenhouseConnector";

/**
 * Conector para Jooble (España y LATAM).
 */
export async function fetchJoobleJobs(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];

  try {
    const urls = [
      { url: "https://es.jooble.org/SearchResult?ukw=desarrollador%20frontend", region: "SPAIN" as const },
      { url: "https://co.jooble.org/SearchResult?ukw=frontend", region: "LATAM" as const },
    ];

    for (const item of urls) {
      const res = await fetch(item.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();
      // Extraer tarjetas de empleo
      const cardRegex = /<a[^>]*href="([^"]*\/desc\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      const seen = new Set<string>();

      while ((match = cardRegex.exec(html)) !== null) {
        const href = match[1];
        const title = match[2].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");

        if (!title || title.length < 5) continue;
        const fullUrl = href.startsWith("http") ? href : `https://es.jooble.org${href}`;
        if (seen.has(fullUrl)) continue;
        seen.add(fullUrl);

        jobs.push({
          externalId: `jooble-${Date.now()}-${jobs.length}`,
          title,
          company: "Empresa en Jooble",
          location: item.region === "SPAIN" ? "España (Remoto / Híbrido)" : "Colombia / LATAM",
          sourceUrl: fullUrl,
          sourcePlatform: "Jooble",
          rawDescription: `Oferta de empleo para ${title}. Publicada en Jooble. Modalidad remota/híbrida en español.`,
          companySlug: "jooble",
          regionHint: item.region,
        });
      }
    }
  } catch (error) {
    console.error("Error al rastrear Jooble:", error);
  }

  return jobs.slice(0, 15);
}
