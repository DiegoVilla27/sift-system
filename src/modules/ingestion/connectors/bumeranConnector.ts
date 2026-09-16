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

export async function fetchBumeranJobs(): Promise<RawIngestedJob[]> {
  const searchEndpoints = [
    {
      url: "https://www.bumeran.com.co/empleos-busqueda-frontend.html",
      country: "Colombia",
      domain: "https://www.bumeran.com.co",
    },
    {
      url: "https://www.bumeran.com.ar/empleos-busqueda-frontend.html",
      country: "Argentina",
      domain: "https://www.bumeran.com.ar",
    },
    {
      url: "https://www.bumeran.com.co/empleos-busqueda-react.html",
      country: "Colombia",
      domain: "https://www.bumeran.com.co",
    },
  ];

  const jobs: RawIngestedJob[] = [];
  const seenUrls = new Set<string>();

  for (const endpoint of searchEndpoints) {
    try {
      const res = await fetch(endpoint.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "es-419,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Strategy 1: Check for Next.js __NEXT_DATA__
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const parsed = JSON.parse(nextDataMatch[1]);
          const pageProps = parsed?.props?.pageProps || {};
          const avisos =
            pageProps.avisos ||
            pageProps.listAvisos ||
            pageProps.ofertas ||
            pageProps.data?.avisos ||
            pageProps.data?.content ||
            [];

          if (Array.isArray(avisos) && avisos.length > 0) {
            for (const item of avisos) {
              const title = item.titulo || item.title || item.denominacionPuesto || "";
              if (!title || !isFrontendRole(title)) continue;

              const avisoId = item.idAviso || item.id || item.avisoId || "";
              const urlPath = item.url || (item.slug ? `/empleos/${item.slug}-${avisoId}.html` : "");
              const sourceUrl = urlPath.startsWith("http")
                ? urlPath
                : `${endpoint.domain}${urlPath || `/empleos/detalle-${avisoId}.html`}`;

              if (seenUrls.has(sourceUrl)) continue;
              seenUrls.add(sourceUrl);

              const company = item.empresa || item.nombreEmpresa || item.company?.name || "Empresa en Bumeran";
              const location =
                item.localizacion ||
                item.zona ||
                item.ciudad ||
                `${endpoint.country} (Remoto / Presencial)`;
              const description = cleanText(
                item.detalle || item.descripcion || item.summary || `Oferta para ${title} en Bumeran ${endpoint.country}`
              );

              const langCheck = isSpanishJob(title, description);
              if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
                continue;
              }

              jobs.push({
                externalId: `bum-${endpoint.country.slice(0, 2).toLowerCase()}-${avisoId || jobs.length}`,
                title,
                company,
                location,
                sourceUrl,
                sourcePlatform: "Bumeran",
                rawDescription: description.slice(0, 4000),
                companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "bumeran",
                regionHint: "LATAM",
              });

              if (jobs.length >= 20) return jobs;
            }
          }
        } catch {
          // Fall through to regex HTML scraping
        }
      }

      // Strategy 2: Regex HTML scraping for job listings and links
      const linkRegex = /<a[^>]+href="(\/empleos\/[^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(html)) !== null) {
        const path = match[1];
        const inner = match[2];

        // Filter out search or pagination links
        if (path.includes("busqueda") || path.includes("pagina")) continue;

        const sourceUrl = `${endpoint.domain}${path.split("?")[0]}`;
        if (seenUrls.has(sourceUrl)) continue;

        // Title from h2/h3 or fallback
        const titleMatch = inner.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
        const titleCandidate = titleMatch ? cleanText(titleMatch[1]) : cleanText(inner);

        if (!titleCandidate || titleCandidate.length < 4 || !isFrontendRole(titleCandidate)) {
          continue;
        }

        seenUrls.add(sourceUrl);

        // Company
        const compMatch = inner.match(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>|<span[^>]*class="[^"]*(?:company|empresa)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const company = compMatch ? cleanText(compMatch[1] || compMatch[2] || "") : "Empresa en Bumeran";

        // Location
        const locMatch = inner.match(/<span[^>]*class="[^"]*(?:location|zona|lugar)[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
        const location = locMatch ? cleanText(locMatch[1]) : `${endpoint.country} (Remoto / Presencial)`;

        const description = `Oferta de empleo para ${titleCandidate} en ${company}. Publicada en Bumeran ${endpoint.country}.`;

        const langCheck = isSpanishJob(titleCandidate, description);
        if (!langCheck.isSpanish || langCheck.hasEnglishDealBreaker) {
          continue;
        }

        const idMatch = path.match(/-(\d+)\.html$/);
        const externalId = idMatch ? `bum-${idMatch[1]}` : `bum-${Date.now()}-${jobs.length}`;

        jobs.push({
          externalId,
          title: titleCandidate,
          company,
          location,
          sourceUrl,
          sourcePlatform: "Bumeran",
          rawDescription: description,
          companySlug: company.toLowerCase().replace(/[^a-z0-9]/g, "") || "bumeran",
          regionHint: "LATAM",
        });

        if (jobs.length >= 20) return jobs;
      }
    } catch (error) {
      console.error(`Error fetching Bumeran ${endpoint.country}:`, error);
    }
  }

  return jobs.slice(0, 20);
}
