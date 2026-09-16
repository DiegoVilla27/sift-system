import { CompanyTarget } from "../companyRegistry";

export interface RawIngestedJob {
  externalId: string;
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  sourcePlatform: string;
  rawDescription: string;
  companySlug: string;
  regionHint?: "SPAIN" | "LATAM" | "GLOBAL";
}

const FRONTEND_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "next.js",
  "nextjs",
  "angular",
  "ui engineer",
  "web engineer",
  "software engineer",
  "desarrollador",
];

export async function fetchGreenhouseJobs(company: CompanyTarget): Promise<RawIngestedJob[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company.slug}/jobs?content=true`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) {
      return [];
    }

    const matchingJobs: RawIngestedJob[] = [];

    for (const j of data.jobs) {
      const titleLower = (j.title || "").toLowerCase();
      const isFrontend = FRONTEND_KEYWORDS.some((kw) => titleLower.includes(kw));

      if (isFrontend) {
        matchingJobs.push({
          externalId: `gh-${company.slug}-${j.id}`,
          title: j.title,
          company: company.name,
          location: j.location?.name || company.defaultLocation || "Remote",
          sourceUrl: j.absolute_url,
          sourcePlatform: "Greenhouse",
          rawDescription: j.content ? j.content.replace(/<[^>]+>/g, " ").slice(0, 4000) : "",
          companySlug: company.slug,
          regionHint: company.region,
        });
      }
    }

    return matchingJobs;
  } catch (error) {
    console.error(`Error fetching Greenhouse for ${company.slug}:`, error);
    return [];
  }
}
