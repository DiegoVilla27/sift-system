import { RawIngestedJob } from "./greenhouseConnector";

/**
 * Conector para Google Careers & Empleos de Google.
 * Consulta la API oficial de Google Careers y endpoints públicos de empleos frontend.
 */
export async function fetchGoogleJobs(): Promise<RawIngestedJob[]> {
  const jobs: RawIngestedJob[] = [];

  try {
    // API oficial pública de Google Careers
    const url = "https://careers.google.com/api/v3/search/?q=Frontend%20Developer&page_size=20";
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      const rawJobs = data.jobs || [];

      for (const item of rawJobs) {
        const title = item.title || "";
        const titleLower = title.toLowerCase();

        // Filtrar roles de software / frontend / web
        const isFrontend =
          titleLower.includes("frontend") ||
          titleLower.includes("front-end") ||
          titleLower.includes("web") ||
          titleLower.includes("ui") ||
          titleLower.includes("software engineer") ||
          titleLower.includes("react") ||
          titleLower.includes("angular");

        if (!isFrontend) continue;

        const locs = item.locations || [];
        const locationStr = locs.map((l: any) => l.display_name || l.city || "").filter(Boolean).join(", ") || "Remoto / Global";
        const jobId = item.id || `google-${Date.now()}-${jobs.length}`;
        const applyUrl = item.apply_url || `https://careers.google.com/jobs/results/${jobId}/`;

        jobs.push({
          externalId: `google-${jobId}`,
          title: item.title,
          company: "Google",
          location: locationStr,
          sourceUrl: applyUrl,
          sourcePlatform: "Google",
          rawDescription: `${item.description || item.summary || "Oferta de ingeniería de software en Google."} Calificaciones requeridas: ${(item.qualifications || []).join(" ")}`,
          companySlug: "google",
          regionHint: locationStr.toLowerCase().includes("spain") || locationStr.toLowerCase().includes("madrid") ? "SPAIN" : "LATAM",
        });
      }
    }
  } catch (error) {
    console.error("Error al consultar Google Careers:", error);
  }

  return jobs.slice(0, 20);
}
