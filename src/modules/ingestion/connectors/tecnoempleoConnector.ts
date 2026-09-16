import { RawIngestedJob } from "./greenhouseConnector";

export async function fetchTecnoempleoJobs(): Promise<RawIngestedJob[]> {
  const urls = [
    "https://www.tecnoempleo.com/ofertas-trabajo/?te=frontend",
    "https://www.tecnoempleo.com/ofertas-trabajo/?te=angular",
  ];

  const jobs: RawIngestedJob[] = [];
  const seenUrls = new Set<string>();

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml",
          "Accept-Language": "es-ES,es;q=0.9",
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const html = await res.text();

      // Tecnoempleo job link pattern: href="https://www.tecnoempleo.com/[job-title-company]/[skills]/rf-[id]"
      const linkRegex = /href="(https:\/\/www\.tecnoempleo\.com\/[^"]*rf-[^"]*)"/gi;
      let match: RegExpExecArray | null;

      while ((match = linkRegex.exec(html)) !== null) {
        let cleanUrl = match[1].replace(/['\\]/g, "");
        if (seenUrls.has(cleanUrl)) continue;
        seenUrls.add(cleanUrl);

        // Parse title and company from url slug
        // e.g. /desarrollador-frontend-angular-baoss/html5-css3-javascript/rf-193f...
        const pathParts = cleanUrl.replace("https://www.tecnoempleo.com/", "").split("/");
        const titleSlug = pathParts[0] || "";
        const skillsSlug = pathParts[1] || "";

        // Format title nicely
        const titleWords = titleSlug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        jobs.push({
          externalId: `te-${Date.now()}-${jobs.length}`,
          title: titleWords,
          company: "Empresa en Tecnoempleo",
          location: "España (Remoto / Híbrido)",
          sourceUrl: cleanUrl,
          sourcePlatform: "Tecnoempleo",
          rawDescription: `Oferta de empleo para ${titleWords} publicada en Tecnoempleo España. Tecnologías requeridas: ${skillsSlug.replace(/-/g, ", ")}.`,
          companySlug: "tecnoempleo",
          regionHint: "SPAIN",
        });

        if (jobs.length >= 25) break;
      }
    } catch (err) {
      console.error("Error fetching Tecnoempleo:", err);
    }
  }

  return jobs;
}
