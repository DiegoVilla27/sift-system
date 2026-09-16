import { RawIngestedJob } from "./greenhouseConnector";

export async function fetchRemotiveJobs(): Promise<RawIngestedJob[]> {
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?category=software-dev&search=frontend", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs: RawIngestedJob[] = [];

    for (const item of data.jobs) {
      jobs.push({
        externalId: `remotive-${item.id}`,
        title: item.title,
        company: item.company_name,
        location: item.candidate_required_location || "100% Remoto",
        sourceUrl: item.url,
        sourcePlatform: "Remotive",
        rawDescription: (item.description || "").replace(/<[^>]+>/g, " ").slice(0, 4000),
        companySlug: item.company_name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        regionHint: "LATAM",
      });
    }

    return jobs.slice(0, 15);
  } catch (err) {
    console.error("Error fetching Remotive:", err);
    return [];
  }
}
