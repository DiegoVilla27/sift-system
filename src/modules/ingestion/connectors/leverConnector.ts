import { CompanyTarget } from "../companyRegistry";
import { RawIngestedJob } from "./greenhouseConnector";

const FRONTEND_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "next.js",
  "nextjs",
  "angular",
  "ui",
  "web",
  "software engineer",
  "desarrollador",
];

export async function fetchLeverJobs(company: CompanyTarget): Promise<RawIngestedJob[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${company.slug}?mode=json`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    const matchingJobs: RawIngestedJob[] = [];

    for (const j of data) {
      const titleLower = (j.text || "").toLowerCase();
      const isFrontend = FRONTEND_KEYWORDS.some((kw) => titleLower.includes(kw));

      if (isFrontend) {
        const location =
          j.categories?.location ||
          j.categories?.allLocations?.join(", ") ||
          company.defaultLocation ||
          "Remote";

        const rawText = j.descriptionPlain || (j.description ? j.description.replace(/<[^>]+>/g, " ") : "");

        matchingJobs.push({
          externalId: `lever-${company.slug}-${j.id}`,
          title: j.text,
          company: company.name,
          location,
          sourceUrl: j.hostedUrl || j.applyUrl,
          sourcePlatform: "Lever",
          rawDescription: rawText.slice(0, 4000),
          companySlug: company.slug,
          regionHint: company.region,
        });
      }
    }

    return matchingJobs;
  } catch (error) {
    console.error(`Error fetching Lever for ${company.slug}:`, error);
    return [];
  }
}
