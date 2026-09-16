import { RawIngestedJob } from "./greenhouseConnector";

export async function fetchCompuTrabajoJobs(): Promise<RawIngestedJob[]> {
  const urls = [
    "https://co.computrabajo.com/trabajo-de-frontend",
    "https://co.computrabajo.com/trabajo-de-react",
  ];

  const jobs: RawIngestedJob[] = [];
  const seenUrls = new Set<string>();

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
          "Accept-Language": "es-CO,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Extract article boxes or links: <a class="js-o-link fc_base" href="...">Title</a>
      const articleRegex = /<article[^>]*class="[^"]*box_offer[^"]*"[\s\S]*?<\/article>/gi;
      const articles = html.match(articleRegex) || [];

      for (const art of articles) {
        const titleMatch = art.match(/<a[^>]*class="[^"]*js-o-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;

        const href = titleMatch[1];
        const title = titleMatch[2].trim().replace(/\s+/g, " ");

        if (!title || !href) continue;

        const fullUrl = href.startsWith("http") ? href.split("#")[0] : `https://co.computrabajo.com${href.split("#")[0]}`;
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);

        // Company
        const compMatch = art.match(/class="[^"]*fc_base[^"]*"[^>]*href="[^"]*empresa[^"]*"[^>]*>([\s\S]*?)<\/a>|class="[^"]*it-blank[^"]*">([\s\S]*?)<\/a>/i);
        const company = compMatch ? (compMatch[1] || compMatch[2] || "").trim().replace(/\s+/g, " ") : "Empresa en CompuTrabajo";

        // Location
        const locMatch = art.match(/<p[^>]*class="[^"]*fs16[^"]*"[^>]*>([\s\S]*?)<\/p>|<span[^>]*class="[^"]*mr10[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const location = locMatch ? (locMatch[1] || locMatch[2] || "").replace(/<[^>]+>/g, "").trim() : "Colombia (Remoto / Presencial)";

        // Description snippet
        const descMatch = art.match(/<p[^>]*class="[^"]*text_ellipsis[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : `Oferta de empleo para ${title} en Colombia.`;

        jobs.push({
          externalId: `ct-co-${Date.now()}-${jobs.length}`,
          title,
          company,
          location: `${location}, Colombia`,
          sourceUrl: fullUrl,
          sourcePlatform: "CompuTrabajo",
          rawDescription: description,
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, ""),
          regionHint: "LATAM",
        });
      }
    } catch (err) {
      console.error("Error fetching CompuTrabajo:", err);
    }
  }

  return jobs.slice(0, 20);
}
