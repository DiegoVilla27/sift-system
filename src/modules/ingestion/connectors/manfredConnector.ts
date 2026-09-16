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

function isFrontendRole(title: string, tags?: string[]): boolean {
  const t = title.toLowerCase();
  if (FRONTEND_KEYWORDS.some((kw) => t.includes(kw))) {
    return true;
  }
  if (tags && Array.isArray(tags)) {
    const s = tags.join(" ").toLowerCase();
    return FRONTEND_KEYWORDS.some((kw) => s.includes(kw));
  }
  return false;
}

export async function fetchManfredJobs(): Promise<RawIngestedJob[]> {
  const url = "https://www.getmanfred.com/api/offers?lang=es";

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Manfred API returned status: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const rawOffers = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.offers)
      ? json.offers
      : [];

    if (rawOffers.length === 0) {
      return [];
    }

    const jobs: RawIngestedJob[] = [];
    const seenUrls = new Set<string>();

    for (const item of rawOffers) {
      const title = item.title || item.name || item.position || "";
      if (!title) continue;

      const tags: string[] = [];
      if (Array.isArray(item.tags)) {
        for (const t of item.tags) {
          if (typeof t === "string") tags.push(t);
          else if (t?.name) tags.push(t.name);
        }
      }
      if (Array.isArray(item.roles)) {
        for (const r of item.roles) {
          if (typeof r === "string") tags.push(r);
          else if (r?.name) tags.push(r.name);
        }
      }
      if (Array.isArray(item.competences)) {
        for (const c of item.competences) {
          if (typeof c === "string") tags.push(c);
          else if (c?.name) tags.push(c.name);
        }
      }

      if (!isFrontendRole(title, tags)) {
        continue;
      }

      const slug = item.slug || item.id || item.uuid || "";
      const sourceUrl = item.publicUrl || (slug ? `https://www.getmanfred.com/offers/${slug}` : "");
      if (!sourceUrl || seenUrls.has(sourceUrl)) continue;
      seenUrls.add(sourceUrl);

      // Extract company
      let company = "Empresa confidencial en Manfred";
      if (item.company) {
        if (typeof item.company === "string") {
          company = item.company;
        } else if (item.company.name) {
          company = item.company.name;
        }
      } else if (item.client?.name) {
        company = item.client.name;
      }

      // Extract location and modality
      let location = "España (Remoto / Híbrido)";
      if (item.location) {
        if (typeof item.location === "string") {
          location = item.location;
        } else if (typeof item.location === "object") {
          const parts = [
            item.location.city,
            item.location.region,
            item.location.country || "España",
          ].filter(Boolean);
          location = parts.length > 0 ? parts.join(", ") : location;
        }
      }
      if (item.modality) {
        const modalityStr = typeof item.modality === "string" ? item.modality : item.modality.name || "";
        if (modalityStr) {
          location = `${location} - ${modalityStr}`;
        }
      }

      // Extract description
      let rawDescription = "";
      if (item.description) {
        rawDescription = typeof item.description === "string" ? item.description : JSON.stringify(item.description);
      } else if (item.summary) {
        rawDescription = item.summary;
      } else if (item.details) {
        rawDescription = typeof item.details === "string" ? item.details : JSON.stringify(item.details);
      }

      if (!rawDescription || rawDescription.length < 20) {
        rawDescription = `Oferta técnica para ${title} gestionada por Manfred en España. Competencias y tecnologías: ${tags.join(", ") || "Frontend, React, TypeScript, Angular"}.`;
      } else {
        rawDescription = cleanText(rawDescription);
      }

      // Validate Spanish language
      const langCheck = isSpanishJob(title, rawDescription);
      if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
        continue;
      }

      jobs.push({
        externalId: `manfred-${slug || jobs.length}`,
        title,
        company,
        location,
        sourceUrl,
        sourcePlatform: "Manfred",
        rawDescription: rawDescription.slice(0, 4000),
        companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "manfred",
        regionHint: "SPAIN",
      });

      if (jobs.length >= 20) break;
    }

    return jobs;
  } catch (error) {
    console.error("Error fetching Manfred jobs:", error);
    return [];
  }
}
