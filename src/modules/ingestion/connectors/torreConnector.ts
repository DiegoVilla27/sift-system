import { RawIngestedJob } from "./greenhouseConnector";
import { isSpanishJob } from "../languageFilter";

const FRONTEND_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "angular",
  "next.js",
  "nextjs",
  "typescript",
  "flutter",
  "ionic",
  "react native",
  "web developer",
  "ui developer",
  "desarrollador frontend",
  "desarrollador front-end",
  "desarrollador web",
  "full stack",
  "fullstack",
];

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFrontendRole(title: string, skills?: string[]): boolean {
  const t = title.toLowerCase();
  if (FRONTEND_KEYWORDS.some((kw) => t.includes(kw))) {
    return true;
  }
  if (skills && Array.isArray(skills)) {
    const s = skills.join(" ").toLowerCase();
    return FRONTEND_KEYWORDS.some((kw) => s.includes(kw));
  }
  return false;
}

export async function fetchTorreJobs(): Promise<RawIngestedJob[]> {
  const url = "https://torre.ai/api/entities/_searchJobs";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
      },
      body: JSON.stringify({
        or: false,
        offset: 0,
        size: 40,
        aggregate: false,
      }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Torre API returned status: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const rawList = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.data)
      ? data.data
      : [];

    if (rawList.length === 0) {
      return [];
    }

    const jobs: RawIngestedJob[] = [];
    const seenUrls = new Set<string>();

    for (const item of rawList) {
      const title = item.objective || item.title || item.name || "";
      if (!title) continue;

      const skills: string[] = Array.isArray(item.skills)
        ? item.skills.map((s: { name?: string } | string) => (typeof s === "string" ? s : s.name || ""))
        : [];

      if (!isFrontendRole(title, skills)) {
        continue;
      }

      const jobId = item.id || item._id || item.slug || String(Date.now());
      const sourceUrl = `https://torre.ai/jobs/${jobId}`;

      if (seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      // Company extraction
      let company = "Empresa en Torre";
      if (Array.isArray(item.organizations) && item.organizations.length > 0) {
        company = item.organizations[0].name || item.organizations[0].id || company;
      } else if (item.company?.name) {
        company = item.company.name;
      } else if (typeof item.company === "string") {
        company = item.company;
      }

      // Location extraction
      let location = "Remoto (LATAM)";
      if (item.remote) {
        location = "100% Remoto (LATAM)";
      } else if (Array.isArray(item.locations) && item.locations.length > 0) {
        location = item.locations.join(", ");
      } else if (typeof item.location === "string") {
        location = item.location;
      }

      // Description extraction
      let rawDescription = "";
      if (Array.isArray(item.details)) {
        rawDescription = item.details
          .map((d: { content?: string } | string) => (typeof d === "string" ? d : d.content || ""))
          .join(" ");
      } else if (typeof item.details === "string") {
        rawDescription = item.details;
      } else if (item.summary || item.description) {
        rawDescription = item.summary || item.description || "";
      }

      if (!rawDescription || rawDescription.length < 20) {
        rawDescription = `Oferta para ${title} en ${company}. Habilidades valoradas: ${skills.join(", ") || "Frontend, React, TypeScript"}. Publicada en Torre.ai para profesionales de LATAM.`;
      } else {
        rawDescription = cleanText(rawDescription);
      }

      // Check if it's Spanish and doesn't mandate fluent English
      const langCheck = isSpanishJob(title, rawDescription);
      if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
        continue;
      }

      jobs.push({
        externalId: `torre-${jobId}`,
        title,
        company,
        location,
        sourceUrl,
        sourcePlatform: "Torre",
        rawDescription: rawDescription.slice(0, 4000),
        companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "torre",
        regionHint: "LATAM",
      });

      if (jobs.length >= 20) break;
    }

    return jobs;
  } catch (error) {
    console.error("Error fetching Torre jobs:", error);
    return [];
  }
}
