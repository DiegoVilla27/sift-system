import { RawIngestedJob } from "./greenhouseConnector";
import { isSpanishJob } from "../languageFilter";

export async function fetchLinkedInJobs(region: "SPAIN" | "COLOMBIA"): Promise<RawIngestedJob[]> {
  const geoId = region === "SPAIN" ? "105646813" : "100876405";
  const locationLabel = region === "SPAIN" ? "España" : "Colombia";
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=Desarrollador%20Frontend&geoId=${geoId}&start=0`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const jobs: RawIngestedJob[] = [];

    // Parse job cards with regex
    const cardRegex = /<li[^>]*>[\s\S]*?<div[^>]*class="[^"]*base-search-card[^"]*"[\s\S]*?<\/li>/gi;
    const matches = html.match(cardRegex) || [];

    for (const card of matches) {
      // Extract title
      const titleMatch = card.match(/<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
      const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "";

      // Extract company
      const companyMatch = card.match(/<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>|class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i);
      const company = companyMatch ? (companyMatch[1] || companyMatch[2] || "").trim().replace(/\s+/g, " ") : "Empresa en LinkedIn";

      // Extract location
      const locMatch = card.match(/<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
      const location = locMatch ? locMatch[1].trim().replace(/\s+/g, " ") : locationLabel;

      // Extract link
      const linkMatch = card.match(/<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i);
      const sourceUrl = linkMatch ? linkMatch[1].split("?")[0] : "";

      if (title && sourceUrl) {
        jobs.push({
          externalId: `li-${region.toLowerCase()}-${Date.now()}-${jobs.length}`,
          title,
          company,
          location,
          sourceUrl,
          sourcePlatform: "LinkedIn",
          rawDescription: `Oferta de empleo para ${title} en ${company} (${location}). Publicada en LinkedIn Empleos.`,
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, ""),
          regionHint: region === "SPAIN" ? "SPAIN" : "LATAM",
        });
      }
    }

    return jobs.slice(0, 15);
  } catch (error) {
    console.error(`Error fetching LinkedIn Jobs for ${region}:`, error);
    return [];
  }
}
