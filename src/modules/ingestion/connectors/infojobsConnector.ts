import { RawIngestedJob } from "./greenhouseConnector";

/**
 * Conector para InfoJobs España.
 * Usa fetch con HTML scraping (sin Playwright) para extraer ofertas frontend.
 */
export async function fetchInfoJobsSpain(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];

  try {
    const res = await fetch(
      "https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=Frontend+Developer",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const html = await res.text();

    // Extraer links de ofertas: /of-i... pattern
    const linkRegex = /<a[^>]*href="([^"]*\/of-i[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    const seenUrls = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim().replace(/\s+/g, " ");

      if (!title || title.length < 5) continue;

      const fullUrl = href.startsWith("http")
        ? href.split("?")[0]
        : `https://www.infojobs.net${href.split("?")[0]}`;

      if (seenUrls.has(fullUrl)) continue;
      seenUrls.add(fullUrl);

      // Extraer ciudad del URL
      const locationMatch = fullUrl.match(/infojobs\.net\/([^/]+)\//);
      const city = locationMatch
        ? locationMatch[1].replace(/-/g, " ")
        : "España";

      jobs.push({
        externalId: `ij-es-${Date.now()}-${jobs.length}`,
        title,
        company: "Empresa en InfoJobs",
        location: `${city.charAt(0).toUpperCase() + city.slice(1)}, España`,
        sourceUrl: fullUrl,
        sourcePlatform: "InfoJobs",
        rawDescription: `Oferta de empleo para ${title} en España (${city}). Publicada en InfoJobs.`,
        companySlug: "infojobs",
        regionHint: "SPAIN",
      });
    }

    return jobs.slice(0, 15);
  } catch (error) {
    console.error("Error scraping InfoJobs Spain:", error);
    return [];
  }
}
