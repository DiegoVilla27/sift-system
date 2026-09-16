import { RawIngestedJob } from "./greenhouseConnector";

/**
 * Conector para We Work Remotely (WWR).
 * Consume el feed oficial de trabajos remotos de front-end.
 */
export async function fetchWeWorkRemotelyJobs(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];

  try {
    const url = "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss";
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/rss+xml,application/xml,text/xml",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const itemRegex = /<item>[\s\S]*?<\/item>/gi;
    const items = xml.match(itemRegex) || [];

    for (const item of items) {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i);
      const title = (titleMatch ? titleMatch[1] || titleMatch[2] : "").trim();

      const linkMatch = item.match(/<link>(.*?)<\/link>/i);
      const link = (linkMatch ? linkMatch[1] : "").trim();

      const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i);
      const description = (descMatch ? descMatch[1] || descMatch[2] : "")
        .replace(/<[^>]+>/g, " ")
        .slice(0, 3000);

      if (!title || !link) continue;

      // Separar compañía y título si viene en formato "Company: Title"
      let company = "Empresa Remota (WWR)";
      let cleanTitle = title;
      if (title.includes(":")) {
        const parts = title.split(":");
        company = parts[0].trim();
        cleanTitle = parts.slice(1).join(":").trim();
      }

      jobs.push({
        externalId: `wwr-${link.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`,
        title: cleanTitle,
        company,
        location: "100% Remoto (Global)",
        sourceUrl: link,
        sourcePlatform: "WeWorkRemotely",
        rawDescription: description,
        companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, ""),
        regionHint: "LATAM",
      });
    }
  } catch (error) {
    console.error("Error al consultar We Work Remotely:", error);
  }

  return jobs.slice(0, 15);
}
