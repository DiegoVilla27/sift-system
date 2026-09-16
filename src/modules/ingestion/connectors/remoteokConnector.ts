import { RawIngestedJob } from "./greenhouseConnector";

export async function fetchRemoteOKJobs(): Promise<RawIngestedJob[]> {
  try {
    const res = await fetch("https://remoteok.com/api?tag=frontend", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SiftJobScout/1.0)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const jobs: RawIngestedJob[] = [];

    // The first element of RemoteOK is legal/metadata, skip it
    for (const item of data.slice(1)) {
      if (!item.position || !item.url) continue;

      const titleLower = item.position.toLowerCase();
      if (!titleLower.includes("frontend") && !titleLower.includes("react") && !titleLower.includes("angular") && !titleLower.includes("web")) {
        continue;
      }

      jobs.push({
        externalId: `remoteok-${item.id || item.slug}`,
        title: item.position,
        company: item.company || "Remote Company",
        location: item.location || "100% Remoto (Global)",
        sourceUrl: item.url,
        sourcePlatform: "RemoteOK",
        rawDescription: (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 4000),
        companySlug: item.company_slug || "remoteok",
        regionHint: "GLOBAL",
      });
    }

    return jobs.slice(0, 15);
  } catch (err) {
    console.error("Error fetching RemoteOK:", err);
    return [];
  }
}
