import { Job, JobModality, TargetRegion, CVId } from "@/shared/types";
import { getIngestedJobs } from "@/modules/ingestion/ingestionService";

export interface JobFilterParams {
  query?: string;
  modality?: JobModality | "ALL";
  region?: TargetRegion | "ALL";
  assignedCvId?: CVId | "ALL";
  minScore?: number;
  status?: "AVAILABLE" | "APPLIED" | "DISMISSED" | "ALL";
}

export function getAllAvailableJobs(): Job[] {
  return getIngestedJobs();
}

export function getJobs(params: JobFilterParams = {}): Job[] {
  const all = getAllAvailableJobs();
  const status = params.status || "AVAILABLE";

  return all.filter((job) => {
    // Status filter (AVAILABLE by default hides applied and dismissed)
    if (status === "AVAILABLE") {
      if (job.isApplied || job.isDismissed) return false;
    } else if (status === "APPLIED") {
      if (!job.isApplied) return false;
    } else if (status === "DISMISSED") {
      if (!job.isDismissed) return false;
    }
    // If status === "ALL", no filtering by application or dismissal status

    // Text search query
    if (params.query) {
      const q = params.query.toLowerCase();
      const matchesTitle = job.title.toLowerCase().includes(q);
      const matchesCompany = job.company.toLowerCase().includes(q);
      const matchesStack = job.stack.some((s) => s.toLowerCase().includes(q));
      const matchesLocation = job.location.toLowerCase().includes(q);

      if (!matchesTitle && !matchesCompany && !matchesStack && !matchesLocation) {
        return false;
      }
    }

    // Modality filter (REMOTE, HYBRID)
    if (params.modality && params.modality !== "ALL") {
      if (job.modality !== params.modality) return false;
    }

    // Region filter (SPAIN, LATAM)
    if (params.region && params.region !== "ALL") {
      if (job.region !== params.region) return false;
    }

    // Assigned CV filter (CV_ES, CV_CO)
    if (params.assignedCvId && params.assignedCvId !== "ALL") {
      if (job.assignedCvId !== params.assignedCvId) return false;
    }

    // Min match score filter
    if (params.minScore && job.matchScore < params.minScore) {
      return false;
    }

    return true;
  });
}

export function getJobById(id: string): Job | undefined {
  return getAllAvailableJobs().find((j) => j.id === id);
}

export function getJobMetrics() {
  const all = getAllAvailableJobs();
  const total = all.length;
  const applied = all.filter((j) => j.isApplied).length;
  const dismissed = all.filter((j) => j.isDismissed).length;
  const available = all.filter((j) => !j.isApplied && !j.isDismissed).length;
  const highMatch = all.filter((j) => !j.isApplied && !j.isDismissed && j.matchScore >= 70).length;
  const remote = all.filter((j) => !j.isApplied && !j.isDismissed && j.modality === "REMOTE").length;
  const hybrid = all.filter((j) => !j.isApplied && !j.isDismissed && j.modality === "HYBRID").length;
  const esCvs = all.filter((j) => !j.isApplied && !j.isDismissed && j.assignedCvId === "CV_ES").length;
  const coCvs = all.filter((j) => !j.isApplied && !j.isDismissed && j.assignedCvId === "CV_CO").length;

  return {
    total,
    applied,
    dismissed,
    available,
    pending: available,
    highMatch,
    remote,
    hybrid,
    esCvs,
    coCvs,
  };
}
