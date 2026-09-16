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

export async function fetchEmpleateJobs(): Promise<RawIngestedJob[]> {
  const urls = [
    "https://www.empleate.com/ofertas-empleo/frontend/",
    "https://www.empleate.com/ofertas-empleo/desarrollador-frontend/",
    "https://www.empleate.com/buscar?q=frontend",
  ];

  const jobs: RawIngestedJob[] = [];
  const seenUrls = new Set<string>();

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Look for article or card blocks
      const cardRegex = /<(?:article|div)[^>]*class="[^"]*(?:oferta|job-card|listing-item|item-oferta)[^"]*"[\s\S]*?<\/(?:article|div)>/gi;
      const cards = html.match(cardRegex) || [];

      for (const card of cards) {
        const linkMatch = card.match(/<a[^>]+href="([^"]*(?:\/ofertas-empleo\/|\/oferta\/|\/empleo\/)[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!linkMatch) continue;

        const href = linkMatch[1];
        const sourceUrl = href.startsWith("http") ? href.split("?")[0] : `https://www.empleate.com${href.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;

        const titleMatch = card.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const titleCandidate = titleMatch ? cleanText(titleMatch[1]) : cleanText(linkMatch[2]);

        if (!titleCandidate || titleCandidate.length < 4 || !isFrontendRole(titleCandidate)) {
          continue;
        }

        seenUrls.add(sourceUrl);

        // Company
        const compMatch = card.match(/class="[^"]*(?:company|empresa)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p|a)>/i);
        const company = compMatch ? cleanText(compMatch[1]) : "Empresa en Empleate";

        // Location
        const locMatch = card.match(/class="[^"]*(?:location|ciudad|lugar|pais)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/i);
        const location = locMatch ? cleanText(locMatch[1]) : "España (Remoto / Presencial)";

        // Description snippet
        const descMatch = card.match(/class="[^"]*(?:description|detalle|snippet|resumen)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i);
        const description = descMatch
          ? cleanText(descMatch[1])
          : `Oferta de empleo para ${titleCandidate} en ${company}. Publicada en Empleate España.`;

        const langCheck = isSpanishJob(titleCandidate, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        jobs.push({
          externalId: `emp-${Date.now()}-${jobs.length}`,
          title: titleCandidate,
          company,
          location: location.includes("España") ? location : `${location}, España`,
          sourceUrl,
          sourcePlatform: "Empleate",
          rawDescription: description.slice(0, 4000),
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "empleate",
          regionHint: "SPAIN",
        });

        if (jobs.length >= 20) return jobs;
      }

      // Fallback: general anchor regex matching job URLs
      if (jobs.length < 5) {
        const linkOnlyRegex = /<a[^>]+href="(\/(?:ofertas-empleo|oferta|empleo)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let generalMatch: RegExpExecArray | null;

        while ((generalMatch = linkOnlyRegex.exec(html)) !== null) {
          const href = generalMatch[1];
          const text = cleanText(generalMatch[2]);

          if (href.endsWith("/frontend/") || href.endsWith("/desarrollador-frontend/")) {
            continue;
          }

          const sourceUrl = `https://www.empleate.com${href.split("?")[0]}`;
          if (seenUrls.has(sourceUrl)) continue;

          if (!text || text.length < 5 || !isFrontendRole(text)) {
            continue;
          }

          seenUrls.add(sourceUrl);

          const description = `Oferta de empleo para ${text} en España. Publicada en portal Empleate.`;
          const langCheck = isSpanishJob(text, description);
          if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
            continue;
          }

          jobs.push({
            externalId: `emp-${Date.now()}-${jobs.length}`,
            title: text,
            company: "Empresa en Empleate",
            location: "España (Remoto / Presencial)",
            sourceUrl,
            sourcePlatform: "Empleate",
            rawDescription: description,
            companySlug: "empleate",
            regionHint: "SPAIN",
          });

          if (jobs.length >= 20) return jobs;
        }
      }
    } catch (error) {
      console.error("Error fetching Empleate jobs:", error);
    }
  }

  return jobs.slice(0, 20);
}
