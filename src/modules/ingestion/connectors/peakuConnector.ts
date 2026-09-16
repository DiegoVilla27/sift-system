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

export async function fetchPeakUJobs(): Promise<RawIngestedJob[]> {
  const urls = [
    "https://www.peaku.co/trabajos/frontend",
    "https://www.peaku.co/trabajos/react",
    "https://www.peaku.co/trabajos/desarrollador-frontend",
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
          "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Strategy 1: Check for Next.js embedded data (__NEXT_DATA__)
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const parsed = JSON.parse(nextDataMatch[1]);
          const pageProps = parsed?.props?.pageProps || {};
          const candidateLists = [
            pageProps.jobs,
            pageProps.vacancies,
            pageProps.offers,
            pageProps.data?.jobs,
            pageProps.data?.vacancies,
            pageProps.initialState?.jobs,
          ];

          for (const list of candidateLists) {
            if (Array.isArray(list) && list.length > 0) {
              for (const item of list) {
                const title = item.title || item.name || item.job_title || "";
                if (!title || !isFrontendRole(title)) continue;

                const jobSlug = item.slug || item.id || item._id || "";
                const sourceUrl = item.url
                  ? (item.url.startsWith("http") ? item.url : `https://www.peaku.co${item.url}`)
                  : `https://www.peaku.co/trabajos/${jobSlug}`;

                if (seenUrls.has(sourceUrl)) continue;
                seenUrls.add(sourceUrl);

                const company = item.company_name || item.company?.name || "Empresa en PeakU";
                const location = item.location || item.city || item.modality || "Colombia / Remoto (LATAM)";
                const description = cleanText(item.description || item.summary || item.requirement || `Oferta para ${title} en PeakU`);

                const langCheck = isSpanishJob(title, description);
                if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
                  continue;
                }

                jobs.push({
                  externalId: `peaku-${jobSlug || jobs.length}`,
                  title,
                  company,
                  location: location.includes("Remoto") ? location : `${location} (Remoto / Presencial)`,
                  sourceUrl,
                  sourcePlatform: "PeakU",
                  rawDescription: description.slice(0, 4000),
                  companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "peaku",
                  regionHint: "LATAM",
                });

                if (jobs.length >= 20) return jobs;
              }
            }
          }
        } catch {
          // Fall through to regex HTML scraping
        }
      }

      // Strategy 2: Regex HTML scraping for job listings and links
      const jobLinkRegex = /<a[^>]+href="(\/trabajos\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      while ((match = jobLinkRegex.exec(html)) !== null) {
        const href = match[1];
        const innerContent = match[2];

        // Skip non-job links like category breadcrumbs
        if (href === "/trabajos/frontend" || href === "/trabajos/react" || href === "/trabajos") {
          continue;
        }

        const sourceUrl = `https://www.peaku.co${href.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;

        // Extract title from inner heading or fallback to cleaned anchor text
        const titleMatch = innerContent.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const titleCandidate = titleMatch ? cleanText(titleMatch[1]) : cleanText(innerContent);

        if (!titleCandidate || titleCandidate.length < 4 || !isFrontendRole(titleCandidate)) {
          continue;
        }

        seenUrls.add(sourceUrl);

        // Extract company if present in anchor content
        const companyMatch = innerContent.match(/<p[^>]*class="[^"]*(?:company|enterprise)[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const company = companyMatch ? cleanText(companyMatch[1]) : "Empresa en PeakU";

        // Extract location if present
        const locMatch = innerContent.match(/<span[^>]*class="[^"]*(?:location|city)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const location = locMatch ? cleanText(locMatch[1]) : "Colombia / LATAM (Remoto)";

        const description = `Oferta de empleo para ${titleCandidate} en ${company}. Modalidad remota / híbrida en PeakU para talento tecnológico en Latinoamérica.`;

        const langCheck = isSpanishJob(titleCandidate, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        jobs.push({
          externalId: `peaku-${href.replace("/trabajos/", "").replace(/\//g, "-") || Date.now()}`,
          title: titleCandidate,
          company,
          location,
          sourceUrl,
          sourcePlatform: "PeakU",
          rawDescription: description,
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "peaku",
          regionHint: "LATAM",
        });

        if (jobs.length >= 20) return jobs;
      }
    } catch (error) {
      console.error("Error fetching PeakU jobs:", error);
    }
  }

  return jobs.slice(0, 20);
}
