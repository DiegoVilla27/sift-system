import fs from "fs";
import path from "path";
import {
  Job,
  PostulacionRecord,
  DismissedJobRecord,
  TrackingNote,
  PortalConfig,
  CandidateProfile,
} from "@/shared/types";

const STORAGE_DIR = path.join(process.cwd(), "storage");
const JOBS_FILE = path.join(STORAGE_DIR, "jobs.json");
const APPLICATIONS_FILE = path.join(STORAGE_DIR, "applications.json");
const DISMISSED_FILE = path.join(STORAGE_DIR, "dismissed_jobs.json");
const PLATFORMS_FILE = path.join(STORAGE_DIR, "platforms.json");
const PROFILE_FILE = path.join(STORAGE_DIR, "candidate_profile.json");

function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  ensureStorageDir();
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing ${path.basename(filePath)}:`, err);
  }
}

// ==================== JOBS (Vacantes) ====================

export function getStoredJobs(): Job[] {
  const jobs = readJson<Job[]>(JOBS_FILE, []);
  const applications = getStoredApplications();
  const dismissed = getStoredDismissedJobs();

  const appliedUrls = new Set(
    applications.map((a) => a.sourceUrl.toLowerCase().trim())
  );
  const appliedIds = new Set(applications.map((a) => a.jobId));

  const dismissedUrls = new Set(
    dismissed
      .filter((d) => d.portalUrl)
      .map((d) => d.portalUrl!.toLowerCase().trim())
  );
  const dismissedIds = new Set(dismissed.map((d) => d.jobId));
  const dismissedKeys = new Set(
    dismissed.map(
      (d) =>
        `${d.company.toLowerCase().trim()}:::${d.jobTitle.toLowerCase().trim()}`
    )
  );

  for (const job of jobs) {
    const normUrl = (job.sourceUrl || "").toLowerCase().trim();
    const normKey = `${job.company.toLowerCase().trim()}:::${job.title.toLowerCase().trim()}`;

    if (appliedIds.has(job.id) || (normUrl && appliedUrls.has(normUrl))) {
      job.isApplied = true;
    }
    if (
      dismissedIds.has(job.id) ||
      (normUrl && dismissedUrls.has(normUrl)) ||
      dismissedKeys.has(normKey)
    ) {
      job.isDismissed = true;
    }
  }

  return jobs;
}

export function saveStoredJobs(jobs: Job[]): void {
  writeJson(JOBS_FILE, jobs);
}

// ==================== POSTULACIONES ====================

export function getStoredApplications(): PostulacionRecord[] {
  return readJson<PostulacionRecord[]>(APPLICATIONS_FILE, []);
}

export function saveStoredApplications(apps: PostulacionRecord[]): void {
  writeJson(APPLICATIONS_FILE, apps);
}

export function appendApplication(app: PostulacionRecord): void {
  const current = getStoredApplications();
  const updated = [
    app,
    ...current.filter((a) => a.id !== app.id && a.jobId !== app.jobId),
  ];
  saveStoredApplications(updated);

  // Marcar en jobs.json
  const jobs = readJson<Job[]>(JOBS_FILE, []);
  let modified = false;
  for (const j of jobs) {
    if (j.id === app.jobId || (app.sourceUrl && j.sourceUrl === app.sourceUrl)) {
      j.isApplied = true;
      j.appliedAt = app.appliedAt;
      modified = true;
    }
  }
  if (modified) {
    saveStoredJobs(jobs);
  }
}

export function updateApplicationStage(
  appId: string,
  stage: PostulacionRecord["stage"]
): void {
  const apps = getStoredApplications();
  const target = apps.find((a) => a.id === appId);
  if (target) {
    target.stage = stage;
    saveStoredApplications(apps);
  }
}

export function addTrackingNote(appId: string, text: string): TrackingNote | null {
  const apps = getStoredApplications();
  const target = apps.find((a) => a.id === appId);
  if (!target) return null;

  const note: TrackingNote = {
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString(),
    text,
  };

  if (!target.trackingNotes) {
    target.trackingNotes = [];
  }
  target.trackingNotes.unshift(note);
  saveStoredApplications(apps);
  return note;
}

// ==================== DISMISSED JOBS (Rechazadas) ====================

export function getStoredDismissedJobs(): DismissedJobRecord[] {
  return readJson<DismissedJobRecord[]>(DISMISSED_FILE, []);
}

export function dismissJob(jobData: {
  jobId: string;
  company: string;
  jobTitle: string;
  portalUrl?: string;
}): void {
  const current = getStoredDismissedJobs();

  const record: DismissedJobRecord = {
    id: `dismissed-${Date.now()}`,
    jobId: jobData.jobId,
    company: jobData.company,
    jobTitle: jobData.jobTitle,
    portalUrl: jobData.portalUrl,
    dismissedAt: new Date().toISOString(),
  };

  const updated = [
    record,
    ...current.filter(
      (d) =>
        d.jobId !== jobData.jobId &&
        (!jobData.portalUrl || d.portalUrl !== jobData.portalUrl)
    ),
  ];

  writeJson(DISMISSED_FILE, updated);

  // Marcar en jobs.json
  const jobs = readJson<Job[]>(JOBS_FILE, []);
  let modified = false;
  for (const j of jobs) {
    if (
      j.id === jobData.jobId ||
      (jobData.portalUrl && j.sourceUrl === jobData.portalUrl) ||
      (`${j.company.toLowerCase().trim()}:::${j.title.toLowerCase().trim()}` ===
        `${jobData.company.toLowerCase().trim()}:::${jobData.jobTitle.toLowerCase().trim()}`)
    ) {
      j.isDismissed = true;
      j.dismissedAt = record.dismissedAt;
      modified = true;
    }
  }
  if (modified) {
    saveStoredJobs(jobs);
  }
}

// ==================== PLATFORMS / PORTALES ====================

export const DEFAULT_PLATFORMS: PortalConfig[] = [
  // ─── Portales de Empleo Generales & Tech (19) ───
  { id: "google", name: "Google Careers & Jobs", category: "portal", enabled: true, url: "https://careers.google.com", regionHint: "GLOBAL" },
  { id: "linkedin_es", name: "LinkedIn España", category: "portal", enabled: true, url: "https://www.linkedin.com/jobs", regionHint: "SPAIN" },
  { id: "linkedin_co", name: "LinkedIn Colombia / LATAM", category: "portal", enabled: true, url: "https://www.linkedin.com/jobs", regionHint: "LATAM" },
  { id: "infojobs", name: "InfoJobs España", category: "portal", enabled: true, url: "https://www.infojobs.net", regionHint: "SPAIN" },
  { id: "computrabajo", name: "CompuTrabajo", category: "portal", enabled: true, url: "https://co.computrabajo.com", regionHint: "LATAM" },
  { id: "getonboard", name: "Get on Board", category: "portal", enabled: true, url: "https://www.getonbrd.com", regionHint: "LATAM" },
  { id: "tecnoempleo", name: "Tecnoempleo España", category: "portal", enabled: true, url: "https://www.tecnoempleo.com", regionHint: "SPAIN" },
  { id: "peaku", name: "PeakU (Remoto Tech)", category: "portal", enabled: true, url: "https://www.peaku.co", regionHint: "LATAM" },
  { id: "torre", name: "Torre.ai", category: "portal", enabled: true, url: "https://torre.ai", regionHint: "LATAM" },
  { id: "manfred", name: "Manfred (Tech España)", category: "portal", enabled: true, url: "https://www.getmanfred.com", regionHint: "SPAIN" },
  { id: "bumeran", name: "Bumeran (Argentina/Colombia)", category: "portal", enabled: true, url: "https://www.bumeran.com.co", regionHint: "LATAM" },
  { id: "domestika", name: "Domestika Empleos (UI/Frontend)", category: "portal", enabled: true, url: "https://www.domestika.org/es/jobs", regionHint: "SPAIN" },
  { id: "jooble", name: "Jooble (España y Colombia)", category: "portal", enabled: true, url: "https://es.jooble.org", regionHint: "SPAIN" },
  { id: "empleate", name: "Empleate España", category: "portal", enabled: true, url: "https://www.empleate.com", regionHint: "SPAIN" },
  { id: "jobatus", name: "Jobatus España", category: "portal", enabled: true, url: "https://www.jobatus.es", regionHint: "SPAIN" },
  { id: "talent", name: "Talent.com (ES/CO)", category: "portal", enabled: true, url: "https://es.talent.com", regionHint: "SPAIN" },
  { id: "weworkremotely", name: "We Work Remotely (Frontend)", category: "portal", enabled: true, url: "https://weworkremotely.com", regionHint: "GLOBAL" },
  { id: "remotive", name: "Remotive (Ofertas en Español)", category: "portal", enabled: true, url: "https://remotive.com", regionHint: "GLOBAL" },
  { id: "remoteok", name: "RemoteOK (Ofertas en Español)", category: "portal", enabled: true, url: "https://remoteok.com", regionHint: "GLOBAL" },

  // ─── Empresas con ATS Directo — España ───
  { id: "ats_gft", name: "GFT Technologies", category: "company_ats", enabled: true, ats: "greenhouse", slug: "gft", regionHint: "SPAIN" },
  { id: "ats_indra", name: "Indra / Minsait", category: "company_ats", enabled: true, ats: "greenhouse", slug: "indra", regionHint: "SPAIN" },
  { id: "ats_nttdata", name: "NTT Data (Everis)", category: "company_ats", enabled: true, ats: "greenhouse", slug: "nttdata", regionHint: "SPAIN" },
  { id: "ats_soprasteria", name: "Sopra Steria", category: "company_ats", enabled: true, ats: "greenhouse", slug: "soprasteria", regionHint: "SPAIN" },
  { id: "ats_capgemini", name: "Capgemini", category: "company_ats", enabled: true, ats: "greenhouse", slug: "capgemini", regionHint: "SPAIN" },
  { id: "ats_cognizant", name: "Cognizant", category: "company_ats", enabled: true, ats: "greenhouse", slug: "cognizant", regionHint: "SPAIN" },
  { id: "ats_thoughtworks", name: "Thoughtworks", category: "company_ats", enabled: true, ats: "greenhouse", slug: "thoughtworks", regionHint: "SPAIN" },
  { id: "ats_epam", name: "EPAM Systems", category: "company_ats", enabled: true, ats: "greenhouse", slug: "epam", regionHint: "SPAIN" },
  { id: "ats_mercadonatech", name: "Mercadona Tech", category: "company_ats", enabled: true, ats: "greenhouse", slug: "mercadonatech", regionHint: "SPAIN" },
  { id: "ats_mango", name: "Mango Tech", category: "company_ats", enabled: true, ats: "greenhouse", slug: "mango", regionHint: "SPAIN" },
  { id: "ats_inditex", name: "Inditex Tech", category: "company_ats", enabled: true, ats: "greenhouse", slug: "inditex", regionHint: "SPAIN" },
  { id: "ats_factorial", name: "Factorial HR", category: "company_ats", enabled: true, ats: "greenhouse", slug: "factorial", regionHint: "SPAIN" },
  { id: "ats_cabify", name: "Cabify", category: "company_ats", enabled: true, ats: "greenhouse", slug: "cabify", regionHint: "SPAIN" },
  { id: "ats_jobandtalent", name: "Jobandtalent", category: "company_ats", enabled: true, ats: "greenhouse", slug: "jobandtalent", regionHint: "SPAIN" },
  { id: "ats_seedtag", name: "Seedtag", category: "company_ats", enabled: true, ats: "greenhouse", slug: "seedtag", regionHint: "SPAIN" },
  { id: "ats_wallapop", name: "Wallapop", category: "company_ats", enabled: true, ats: "greenhouse", slug: "wallapop", regionHint: "SPAIN" },
  { id: "ats_fever", name: "Fever", category: "company_ats", enabled: true, ats: "greenhouse", slug: "fever", regionHint: "SPAIN" },
  { id: "ats_typeform", name: "Typeform", category: "company_ats", enabled: true, ats: "greenhouse", slug: "typeform", regionHint: "SPAIN" },
  { id: "ats_adevinta", name: "Adevinta", category: "company_ats", enabled: true, ats: "greenhouse", slug: "adevinta", regionHint: "SPAIN" },
  { id: "ats_idealista", name: "Idealista", category: "company_ats", enabled: true, ats: "greenhouse", slug: "idealista", regionHint: "SPAIN" },
  { id: "ats_spotahome", name: "Spotahome", category: "company_ats", enabled: true, ats: "greenhouse", slug: "spotahome", regionHint: "SPAIN" },
  { id: "ats_glovo", name: "Glovo", category: "company_ats", enabled: true, ats: "greenhouse", slug: "glovo", regionHint: "SPAIN" },
  { id: "ats_flywire", name: "Flywire", category: "company_ats", enabled: true, ats: "greenhouse", slug: "flywire", regionHint: "SPAIN" },
  { id: "ats_liferay", name: "Liferay", category: "company_ats", enabled: true, ats: "greenhouse", slug: "liferay", regionHint: "SPAIN" },
  { id: "ats_travelperk", name: "TravelPerk", category: "company_ats", enabled: true, ats: "lever", slug: "travelperk", regionHint: "SPAIN" },
  { id: "ats_malt", name: "Malt España", category: "company_ats", enabled: true, ats: "lever", slug: "malt", regionHint: "SPAIN" },
  { id: "ats_manfred_co", name: "Manfred ATS", category: "company_ats", enabled: true, ats: "lever", slug: "manfred", regionHint: "SPAIN" },
  { id: "ats_revolut", name: "Revolut", category: "company_ats", enabled: true, ats: "lever", slug: "revolut", regionHint: "SPAIN" },

  // ─── Empresas con ATS Directo — LATAM ───
  { id: "ats_globant", name: "Globant", category: "company_ats", enabled: true, ats: "greenhouse", slug: "globant", regionHint: "LATAM" },
  { id: "ats_mercadolibre", name: "MercadoLibre", category: "company_ats", enabled: true, ats: "greenhouse", slug: "mercadolibre", regionHint: "LATAM" },
  { id: "ats_rappi", name: "Rappi", category: "company_ats", enabled: true, ats: "greenhouse", slug: "rappi", regionHint: "LATAM" },
  { id: "ats_nubank", name: "Nubank", category: "company_ats", enabled: true, ats: "greenhouse", slug: "nubank", regionHint: "LATAM" },
  { id: "ats_belvo", name: "Belvo", category: "company_ats", enabled: true, ats: "greenhouse", slug: "belvo", regionHint: "LATAM" },
  { id: "ats_kavak", name: "Kavak", category: "company_ats", enabled: true, ats: "greenhouse", slug: "kavak", regionHint: "LATAM" },
  { id: "ats_clip", name: "Clip", category: "company_ats", enabled: true, ats: "greenhouse", slug: "clip", regionHint: "LATAM" },
  { id: "ats_uala", name: "Ualá", category: "company_ats", enabled: true, ats: "greenhouse", slug: "uala", regionHint: "LATAM" },
  { id: "ats_dlocal", name: "dLocal", category: "company_ats", enabled: true, ats: "greenhouse", slug: "dlocal", regionHint: "LATAM" },
  { id: "ats_platzi", name: "Platzi", category: "company_ats", enabled: true, ats: "lever", slug: "platzi", regionHint: "LATAM" },
  { id: "ats_truora", name: "Truora", category: "company_ats", enabled: true, ats: "lever", slug: "truora", regionHint: "LATAM" },
  { id: "ats_habi", name: "Habi", category: "company_ats", enabled: true, ats: "lever", slug: "habi", regionHint: "LATAM" },
  { id: "ats_crehana", name: "Crehana", category: "company_ats", enabled: true, ats: "lever", slug: "crehana", regionHint: "LATAM" },
  { id: "ats_betterfly", name: "Betterfly", category: "company_ats", enabled: true, ats: "lever", slug: "betterfly", regionHint: "LATAM" },
  { id: "ats_konfio", name: "Konfio", category: "company_ats", enabled: true, ats: "lever", slug: "konfio", regionHint: "LATAM" },

  // ─── Gigantes Tecnológicos & Producto Global ───
  { id: "ats_stripe", name: "Stripe", category: "company_ats", enabled: true, ats: "greenhouse", slug: "stripe", regionHint: "SPAIN" },
  { id: "ats_spotify", name: "Spotify", category: "company_ats", enabled: true, ats: "greenhouse", slug: "spotify", regionHint: "SPAIN" },
  { id: "ats_vercel", name: "Vercel", category: "company_ats", enabled: true, ats: "greenhouse", slug: "vercel", regionHint: "SPAIN" },
  { id: "ats_supabase", name: "Supabase", category: "company_ats", enabled: true, ats: "greenhouse", slug: "supabase", regionHint: "SPAIN" },
  { id: "ats_cloudflare", name: "Cloudflare", category: "company_ats", enabled: true, ats: "greenhouse", slug: "cloudflare", regionHint: "SPAIN" },
  { id: "ats_gitlab", name: "GitLab", category: "company_ats", enabled: true, ats: "greenhouse", slug: "gitlab", regionHint: "SPAIN" },
  { id: "ats_automattic", name: "Automattic (WordPress)", category: "company_ats", enabled: true, ats: "greenhouse", slug: "automattic", regionHint: "SPAIN" },
  { id: "ats_n26", name: "N26", category: "company_ats", enabled: true, ats: "greenhouse", slug: "n26", regionHint: "SPAIN" },
  { id: "ats_eventbrite", name: "Eventbrite", category: "company_ats", enabled: true, ats: "greenhouse", slug: "eventbrite", regionHint: "SPAIN" },
];

export function getStoredPlatforms(): PortalConfig[] {
  ensureStorageDir();
  if (!fs.existsSync(PLATFORMS_FILE)) {
    saveStoredPlatforms(DEFAULT_PLATFORMS);
    return DEFAULT_PLATFORMS;
  }
  try {
    const raw = fs.readFileSync(PLATFORMS_FILE, "utf-8");
    const stored: PortalConfig[] = JSON.parse(raw);
    if (!Array.isArray(stored) || stored.length === 0) {
      saveStoredPlatforms(DEFAULT_PLATFORMS);
      return DEFAULT_PLATFORMS;
    }
    // Asegurar que cualquier plataforma nueva por defecto se agregue si no existía
    const storedIds = new Set(stored.map((p) => p.id));
    let hasNew = false;
    for (const def of DEFAULT_PLATFORMS) {
      if (!storedIds.has(def.id)) {
        stored.push(def);
        hasNew = true;
      }
    }
    if (hasNew) {
      saveStoredPlatforms(stored);
    }
    return stored;
  } catch {
    return DEFAULT_PLATFORMS;
  }
}

export function saveStoredPlatforms(platforms: PortalConfig[]): void {
  writeJson(PLATFORMS_FILE, platforms);
}

export function togglePlatform(id: string, enabled: boolean): void {
  const platforms = getStoredPlatforms();
  const target = platforms.find((p) => p.id === id);
  if (target) {
    target.enabled = enabled;
    saveStoredPlatforms(platforms);
  }
}

export function toggleAllPlatforms(enabled: boolean): void {
  const platforms = getStoredPlatforms();
  for (const p of platforms) {
    p.enabled = enabled;
  }
  saveStoredPlatforms(platforms);
}

export function addCustomPlatform(platform: PortalConfig): void {
  const platforms = getStoredPlatforms();
  const filtered = platforms.filter((p) => p.id !== platform.id);
  filtered.push(platform);
  saveStoredPlatforms(filtered);
}

export function removeCustomPlatform(id: string): void {
  const platforms = getStoredPlatforms();
  const updated = platforms.filter((p) => p.id !== id);
  saveStoredPlatforms(updated);
}

// ==================== CANDIDATE PROFILE ====================

export const DEFAULT_CANDIDATE_PROFILE: CandidateProfile = {
  fullName: "Diego Fernando Villanueva Penagos",
  email: "dv270992@gmail.com",
  phone: "+34 658 07 48 21",
  location: "Valencia, España / Colombia (Remoto)",
  roleTitle: "Senior Frontend & Full Stack Developer",
  yearsOfExperience: 8,
  technologies: [
    "Angular",
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "HTML5",
    "CSS3",
    "SCSS",
    "Tailwind CSS",
    "Redux",
    "Zustand",
    "RxJS",
    "NgRx",
    "Signals",
    "REST APIs",
    "GraphQL",
    "Node.js",
    "Express.js",
    "PostgreSQL",
    "MongoDB",
    "Flutter",
    "React Native",
    "Ionic",
    "Docker",
    "Git",
    "Jest",
    "Playwright",
    "Microfrontends",
    "Clean Architecture",
  ],
  minMatchScore: 70,
  cvFileName: "Diego_Villanueva_CV_Espana.pdf",
  lastUpdated: new Date().toISOString(),
};

export function getCandidateProfile(): CandidateProfile {
  ensureStorageDir();
  if (!fs.existsSync(PROFILE_FILE)) {
    saveCandidateProfile(DEFAULT_CANDIDATE_PROFILE);
    return DEFAULT_CANDIDATE_PROFILE;
  }
  try {
    const raw = fs.readFileSync(PROFILE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.technologies || !Array.isArray(parsed.technologies)) {
      return DEFAULT_CANDIDATE_PROFILE;
    }
    if (typeof parsed.minMatchScore !== "number" || parsed.minMatchScore < 0) {
      parsed.minMatchScore = 70;
    }
    return parsed;
  } catch {
    return DEFAULT_CANDIDATE_PROFILE;
  }
}

export function saveCandidateProfile(profile: CandidateProfile): void {
  writeJson(PROFILE_FILE, profile);
}

