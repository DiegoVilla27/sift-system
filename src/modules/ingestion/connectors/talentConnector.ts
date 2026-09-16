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

function isFrontendRole(title: string): boolean {
  const t = title.toLowerCase();
  return FRONTEND_KEYWORDS.some((kw) => t.includes(kw));
}

interface TalentSearchTarget {
  url: string;
  domain: string;
  regionHint: "SPAIN" | "LATAM";
  defaultLocation: string;
  prefix: string;
}

export async function fetchTalentJobs(): Promise<RawIngestedJob[]> {
  const targets: TalentSearchTarget[] = [
    {
      url: "https://es.talent.com/jobs?k=desarrollador+frontend",
      domain: "https://es.talent.com",
      regionHint: "SPAIN",
      defaultLocation: "España (Remoto / Presencial)",
      prefix: "es",
    },
    {
      url: "https://co.talent.com/jobs?k=desarrollador+frontend",
      domain: "https://co.talent.com",
      regionHint: "LATAM",
      defaultLocation: "Colombia (Remoto / Presencial)",
      prefix: "co",
    },
    {
      url: "https://es.talent.com/jobs?k=react",
      domain: "https://es.talent.com",
      regionHint: "SPAIN",
      defaultLocation: "España (Remoto / Presencial)",
      prefix: "es",
    },
    {
      url: "https://co.talent.com/jobs?k=frontend",
      domain: "https://co.talent.com",
      regionHint: "LATAM",
      defaultLocation: "Colombia (Remoto / Presencial)",
      prefix: "co",
    },
  ];

  const jobs: RawIngestedJob[] = [];
  const seenUrls = new Set<string>();

  for (const target of targets) {
    try {
      const res = await fetch(target.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": target.regionHint === "SPAIN" ? "es-ES,es;q=0.9" : "es-CO,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Match cards on Talent.com: <div class="card card__job..." or <div data-id="..."
      const cardRegex = /<div[^>]*class="[^"]*(?:card__job|card--job)[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi;
      const cards = html.match(cardRegex) || [];

      for (const card of cards) {
        // Link and title
        const linkMatch = card.match(/<a[^>]+href="([^"]+)"[^>]*class="[^"]*(?:card__job-title|link-job-title)[^"]*"[^>]*>([\s\S]*?)<\/a>|<a[^>]*class="[^"]*(?:card__job-title|link-job-title)[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        const href = linkMatch ? (linkMatch[1] || linkMatch[3]) : null;
        const rawTitle = linkMatch ? (linkMatch[2] || linkMatch[4]) : null;

        if (!href || !rawTitle) continue;

        const titleCandidate = cleanText(rawTitle);
        if (!titleCandidate || titleCandidate.length < 4 || !isFrontendRole(titleCandidate)) {
          continue;
        }

        const sourceUrl = href.startsWith("http") ? href.split("?")[0] : `${target.domain}${href.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;
        seenUrls.add(sourceUrl);

        // Company
        const compMatch = card.match(/class="[^"]*card__job-company[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p|a)>/i);
        const company = compMatch ? cleanText(compMatch[1]) : "Empresa en Talent.com";

        // Location
        const locMatch = card.match(/class="[^"]*card__job-location[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|p)>/i);
        const location = locMatch ? cleanText(locMatch[1]) : target.defaultLocation;

        // Snippet description
        const descMatch = card.match(/class="[^"]*card__job-snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i);
        const description = descMatch
          ? cleanText(descMatch[1])
          : `Oferta de empleo para ${titleCandidate} en ${company}. Publicada en Talent.com (${target.regionHint === "SPAIN" ? "España" : "Colombia"}).`;

        const langCheck = isSpanishJob(titleCandidate, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        const idMatch = sourceUrl.match(/id=([^&]+)/) || sourceUrl.match(/\/view\?id=([^&]+)/);
        const externalId = idMatch ? `talent-${target.prefix}-${idMatch[1]}` : `talent-${target.prefix}-${Date.now()}-${jobs.length}`;

        jobs.push({
          externalId,
          title: titleCandidate,
          company,
          location: location || target.defaultLocation,
          sourceUrl,
          sourcePlatform: "Talent",
          rawDescription: description.slice(0, 4000),
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "talent",
          regionHint: target.regionHint,
        });

        if (jobs.length >= 20) return jobs;
      }

      // Fallback: search for any anchor linking to /view?id= or job detail
      if (jobs.length < 5) {
        const directLinkRegex = /<a[^>]+href="(\/(?:jobs\/view|view)\?[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
        let directMatch: RegExpExecArray | null;

        while ((directMatch = directLinkRegex.exec(html)) !== null) {
          const href = directMatch[1];
          const rawText = cleanText(directMatch[2]);

          if (!rawText || rawText.length < 5 || !isFrontendRole(rawText)) {
            continue;
          }

          const sourceUrl = `${target.domain}${href.split("&")[0]}`;
          if (seenUrls.has(sourceUrl)) continue;
          seenUrls.add(sourceUrl);

          const description = `Oferta para ${rawText} en ${target.defaultLocation}. Agregada en Talent.com.`;
          const langCheck = isSpanishJob(rawText, description);
          if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
            continue;
          }

          jobs.push({
            externalId: `talent-${target.prefix}-${Date.now()}-${jobs.length}`,
            title: rawText,
            company: "Empresa en Talent.com",
            location: target.defaultLocation,
            sourceUrl,
            sourcePlatform: "Talent",
            rawDescription: description,
            companySlug: "talent",
            regionHint: target.regionHint,
          });

          if (jobs.length >= 20) return jobs;
        }
      }
    } catch (error) {
      console.error(`Error fetching Talent.com (${target.prefix}):`, error);
    }
  }

  return jobs.slice(0, 20);
}
