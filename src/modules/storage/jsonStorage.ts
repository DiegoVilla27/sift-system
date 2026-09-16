import fs from "fs";
import path from "path";
import { Job, ApplicationRecord, DismissedJobRecord } from "@/shared/types";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const JOBS_FILE = path.join(STORAGE_DIR, "jobs.json");
const APPLICATIONS_FILE = path.join(STORAGE_DIR, "applications.json");
const DISMISSED_FILE = path.join(STORAGE_DIR, "dismissed_jobs.json");
const SETTINGS_FILE = path.join(STORAGE_DIR, "settings.json");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// ==================== JOBS ====================
export function getStoredJobs(): Job[] {
  ensureStorageDir();
  if (!fs.existsSync(JOBS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(JOBS_FILE, "utf-8");
    const jobs: Job[] = JSON.parse(raw);

    // Cruzar con applications.json para garantizar persistencia de isApplied
    if (fs.existsSync(APPLICATIONS_FILE)) {
      try {
        const appsRaw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
        const apps: ApplicationRecord[] = JSON.parse(appsRaw);
        
        const appliedUrls = new Set(apps.map((a) => a.portalUrl.toLowerCase().trim()));
        const appliedIds = new Set(apps.map((a) => a.jobId));
        const appliedCompanyRoles = new Set(
          apps.map((a) => `${a.company.toLowerCase().trim()}:::${a.jobTitle.toLowerCase().trim()}`)
        );

        for (const job of jobs) {
          const normUrl = (job.sourceUrl || "").toLowerCase().trim();
          const normKey = `${job.company.toLowerCase().trim()}:::${job.title.toLowerCase().trim()}`;

          if (appliedIds.has(job.id) || appliedUrls.has(normUrl) || appliedCompanyRoles.has(normKey)) {
            job.isApplied = true;
            const matchingApp = apps.find(
              (a) => a.jobId === job.id || a.portalUrl.toLowerCase().trim() === normUrl
            );
            if (matchingApp) {
              job.appliedAt = matchingApp.appliedAt;
              job.applicationStatus = matchingApp.status;
            }
          }
        }
      } catch {}
    }

    // Cruzar con dismissed_jobs.json para garantizar persistencia de isDismissed
    if (fs.existsSync(DISMISSED_FILE)) {
      try {
        const disRaw = fs.readFileSync(DISMISSED_FILE, "utf-8");
        const dismissed: DismissedJobRecord[] = JSON.parse(disRaw);

        const dismissedUrls = new Set(
          dismissed.filter((d) => d.portalUrl).map((d) => d.portalUrl!.toLowerCase().trim())
        );
        const dismissedIds = new Set(dismissed.map((d) => d.jobId));
        const dismissedCompanyRoles = new Set(
          dismissed.map((d) => `${d.company.toLowerCase().trim()}:::${d.jobTitle.toLowerCase().trim()}`)
        );

        for (const job of jobs) {
          const normUrl = (job.sourceUrl || "").toLowerCase().trim();
          const normKey = `${job.company.toLowerCase().trim()}:::${job.title.toLowerCase().trim()}`;

          if (
            dismissedIds.has(job.id) ||
            (normUrl && dismissedUrls.has(normUrl)) ||
            dismissedCompanyRoles.has(normKey)
          ) {
            job.isDismissed = true;
            const matchingDismissed = dismissed.find(
              (d) => d.jobId === job.id || (normUrl && d.portalUrl?.toLowerCase().trim() === normUrl)
            );
            if (matchingDismissed) {
              job.dismissedAt = matchingDismissed.dismissedAt;
              job.dismissReason = matchingDismissed.reason;
            }
          }
        }
      } catch {}
    }

    return jobs;
  } catch (err) {
    console.error("Error reading jobs.json:", err);
    return [];
  }
}

export function saveStoredJobs(jobs: Job[]): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving jobs.json:", err);
  }
}

export function markJobAsApplied(jobId: string, sourceUrl?: string): void {
  const jobs = getStoredJobs();
  let modified = false;

  for (const job of jobs) {
    if (job.id === jobId || (sourceUrl && job.sourceUrl === sourceUrl)) {
      job.isApplied = true;
      job.appliedAt = new Date().toISOString();
      job.applicationStatus = "SUCCESS";
      modified = true;
    }
  }

  if (modified) {
    saveStoredJobs(jobs);
  }
}

// ==================== APPLICATIONS ====================
export function getStoredApplications(): ApplicationRecord[] {
  ensureStorageDir();
  if (!fs.existsSync(APPLICATIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(APPLICATIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading applications.json:", err);
    return [];
  }
}

export function saveStoredApplications(apps: ApplicationRecord[]): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(APPLICATIONS_FILE, JSON.stringify(apps, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving applications.json:", err);
  }
}

export function appendStoredApplication(app: ApplicationRecord): void {
  const current = getStoredApplications();
  const updated = [app, ...current.filter((a) => a.id !== app.id && a.jobId !== app.jobId)];
  saveStoredApplications(updated);
}

// ==================== DISMISSED JOBS ====================
export function getStoredDismissedJobs(): DismissedJobRecord[] {
  ensureStorageDir();
  if (!fs.existsSync(DISMISSED_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(DISMISSED_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading dismissed_jobs.json:", err);
    return [];
  }
}

export function saveStoredDismissedJobs(records: DismissedJobRecord[]): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(DISMISSED_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving dismissed_jobs.json:", err);
  }
}

export function dismissJob(jobData: {
  id?: string;
  jobId: string;
  company: string;
  jobTitle: string;
  portalUrl?: string;
  reason?: string;
}): void {
  const current = getStoredDismissedJobs();
  const newRecord: DismissedJobRecord = {
    id: jobData.id || `dismissed-${Date.now()}`,
    jobId: jobData.jobId,
    company: jobData.company,
    jobTitle: jobData.jobTitle,
    portalUrl: jobData.portalUrl,
    dismissedAt: new Date().toISOString(),
    reason: jobData.reason || "Descartada por el usuario",
  };

  const updated = [
    newRecord,
    ...current.filter((d) => d.jobId !== jobData.jobId && (!jobData.portalUrl || d.portalUrl !== jobData.portalUrl)),
  ];
  saveStoredDismissedJobs(updated);

  // También actualizar en jobs.json
  const jobs = getStoredJobs();
  let modified = false;
  for (const job of jobs) {
    if (
      job.id === jobData.jobId ||
      (jobData.portalUrl && job.sourceUrl === jobData.portalUrl) ||
      (`${job.company.toLowerCase().trim()}:::${job.title.toLowerCase().trim()}` ===
        `${jobData.company.toLowerCase().trim()}:::${jobData.jobTitle.toLowerCase().trim()}`)
    ) {
      job.isDismissed = true;
      job.dismissedAt = newRecord.dismissedAt;
      job.dismissReason = newRecord.reason;
      modified = true;
    }
  }
  if (modified) {
    saveStoredJobs(jobs);
  }
}

export function undismissJob(jobId: string): void {
  const current = getStoredDismissedJobs();
  const updated = current.filter((d) => d.jobId !== jobId);
  saveStoredDismissedJobs(updated);

  // Restaurar en jobs.json
  const jobs = getStoredJobs();
  let modified = false;
  for (const job of jobs) {
    if (job.id === jobId) {
      job.isDismissed = false;
      job.dismissedAt = undefined;
      job.dismissReason = undefined;
      modified = true;
    }
  }
  if (modified) {
    saveStoredJobs(jobs);
  }
}

// ==================== SETTINGS ====================
export interface SystemSettings {
  webhookUrl: string;
  minScore: number;
  notifyOnApply: boolean;
  notifyOnAmbiguity: boolean;
  autoApplyEnabled: boolean;
  maxPerDay: number;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  webhookUrl:
    process.env.DISCORD_WEBHOOK_URL ||
    "https://discord.com/api/webhooks/1549418546327593121/9EimY7LwrpwmlQU1UaZWOdpHMUzeKE-1N79WVaLXViozAdWLCAhJFabrOHVCMyhOb76U",
  minScore: 70,
  notifyOnApply: true,
  notifyOnAmbiguity: true,
  autoApplyEnabled: true,
  maxPerDay: 20,
};

export function getStoredSettings(): SystemSettings {
  ensureStorageDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    saveStoredSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: SystemSettings): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving settings.json:", err);
  }
}
