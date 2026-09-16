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

export async function fetchJobatusJobs(): Promise<RawIngestedJob[]> {
  const urls = [
    "https://www.jobatus.es/trabajo?q=desarrollador+frontend",
    "https://www.jobatus.es/trabajo?q=frontend",
    "https://www.jobatus.es/trabajo?q=react",
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

      // Strategy 1: Match structured job containers
      const containerRegex = /<(?:div|article|li)[^>]*class="[^"]*(?:oferta|job|result-item|item-offer)[^"]*"[\s\S]*?<\/(?:div|article|li)>/gi;
      const containers = html.match(containerRegex) || [];

      for (const item of containers) {
        const linkMatch = item.match(/<a[^>]+href="([^"]*(?:\/trabajo\/|\/oferta\/|\/ofertas-trabajo\/)[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!linkMatch) continue;

        const href = linkMatch[1];
        // Ignore pagination / search links
        if (href.includes("?q=") || href.includes("pagina=")) continue;

        const sourceUrl = href.startsWith("http") ? href.split("?")[0] : `https://www.jobatus.es${href.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;

        const titleMatch = item.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const titleCandidate = titleMatch ? cleanText(titleMatch[1]) : cleanText(linkMatch[2]);

        if (!titleCandidate || titleCandidate.length < 4 || !isFrontendRole(titleCandidate)) {
          continue;
        }

        seenUrls.add(sourceUrl);

        // Company
        const compMatch = item.match(/class="[^"]*(?:empresa|company|organization)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p|a)>/i);
        const company = compMatch ? cleanText(compMatch[1]) : "Empresa en Jobatus";

        // Location
        const locMatch = item.match(/class="[^"]*(?:lugar|location|ciudad|poblacion)[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/i);
        const location = locMatch ? cleanText(locMatch[1]) : "España (Remoto / Presencial)";

        // Description
        const descMatch = item.match(/class="[^"]*(?:descripcion|description|body|snippet)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i);
        const description = descMatch
          ? cleanText(descMatch[1])
          : `Oferta de empleo para ${titleCandidate} en ${company}. Agregada en Jobatus España.`;

        const langCheck = isSpanishJob(titleCandidate, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        jobs.push({
          externalId: `jbt-es-${Date.now()}-${jobs.length}`,
          title: titleCandidate,
          company,
          location: location.includes("España") ? location : `${location}, España`,
          sourceUrl,
          sourcePlatform: "Jobatus",
          rawDescription: description.slice(0, 4000),
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "jobatus",
          regionHint: "SPAIN",
        });

        if (jobs.length >= 20) return jobs;
      }

      // Strategy 2: Match direct job anchor links across page
      const generalLinkRegex = /<a[^>]+href="(\/(?:trabajo\/oferta|trabajo\/detalle|oferta-de-trabajo)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
      let generalMatch: RegExpExecArray | null;

      while ((generalMatch = generalLinkRegex.exec(html)) !== null) {
        const href = generalMatch[1];
        const text = cleanText(generalMatch[2]);

        const sourceUrl = `https://www.jobatus.es${href.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;

        if (!text || text.length < 5 || !isFrontendRole(text)) {
          continue;
        }

        seenUrls.add(sourceUrl);

        const description = `Oferta técnica para ${text} en España encontrada en Jobatus.`;
        const langCheck = isSpanishJob(text, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        jobs.push({
          externalId: `jbt-es-${Date.now()}-${jobs.length}`,
          title: text,
          company: "Empresa en Jobatus",
          location: "España (Remoto / Híbrido)",
          sourceUrl,
          sourcePlatform: "Jobatus",
          rawDescription: description,
          companySlug: "jobatus",
          regionHint: "SPAIN",
        });

        if (jobs.length >= 20) return jobs;
      }
    } catch (error) {
      console.error("Error fetching Jobatus jobs:", error);
    }
  }

  return jobs.slice(0, 20);
}
