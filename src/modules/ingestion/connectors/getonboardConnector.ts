import { RawIngestedJob } from "./greenhouseConnector";
import { isSpanishJob } from "../languageFilter";

export async function fetchGetOnBoardJobs(): Promise<RawIngestedJob[]> {
  const url = "https://www.getonbrd.com/api/v0/categories/programming/jobs?per_page=25";

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    const jobs: RawIngestedJob[] = [];

    for (const item of json.data) {
      const attr = item.attributes || {};
      const title = attr.title || "";
      const titleLower = title.toLowerCase();

      // Check if frontend related
      const isFrontend =
        titleLower.includes("frontend") ||
        titleLower.includes("front-end") ||
        titleLower.includes("react") ||
        titleLower.includes("angular") ||
        titleLower.includes("next") ||
        titleLower.includes("ui developer") ||
        titleLower.includes("web developer");

      if (!isFrontend) continue;

      const rawDesc = `${attr.description || ""} ${attr.functions || ""} ${attr.benefits || ""}`
        .replace(/<[^>]+>/g, " ")
        .slice(0, 4000);

      // Verify it's in Spanish and does not mandate fluent English
      const langCheck = isSpanishJob(title, rawDesc);
      if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
        continue;
      }

      const companyData = item.attributes?.company?.data?.attributes?.name || "Empresa en Get on Board";
      const countries = attr.countries || [];
      const location = attr.remote
        ? `100% Remoto (${countries.join(", ") || "LATAM / España"})`
        : countries.join(", ") || "Remoto";

      const publicUrl = item.links?.public_url || `https://www.getonbrd.com/jobs/${item.id}`;

      jobs.push({
        externalId: `gob-${item.id}`,
        title,
        company: companyData,
        location,
        sourceUrl: publicUrl,
        sourcePlatform: "GetOnBoard",
        rawDescription: rawDesc,
        companySlug: "getonboard",
        regionHint: "LATAM",
      });
    }

    return jobs;
  } catch (error) {
    console.error("Error fetching Get on Board jobs:", error);
    return [];
  }
}
