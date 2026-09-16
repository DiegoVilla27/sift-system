import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";
import { TARGET_COMPANIES } from "./companyRegistry";
import { fetchGreenhouseJobs, RawIngestedJob } from "./connectors/greenhouseConnector";
import { fetchLeverJobs } from "./connectors/leverConnector";
import { fetchLinkedInJobs } from "./connectors/linkedinConnector";
import { fetchInfoJobsSpain } from "./connectors/infojobsConnector";
import { fetchCompuTrabajoJobs } from "./connectors/computrabajoConnector";
import { fetchGetOnBoardJobs } from "./connectors/getonboardConnector";
import { fetchTecnoempleoJobs } from "./connectors/tecnoempleoConnector";
import { fetchRemotiveJobs } from "./connectors/remotiveConnector";
import { fetchRemoteOKJobs } from "./connectors/remoteokConnector";
import { fetchPeakUJobs } from "./connectors/peakuConnector";
import { fetchTorreJobs } from "./connectors/torreConnector";
import { fetchManfredJobs } from "./connectors/manfredConnector";
import { fetchBumeranJobs } from "./connectors/bumeranConnector";
import { fetchEmpleateJobs } from "./connectors/empleateConnector";
import { fetchJobatusJobs } from "./connectors/jobatusConnector";
import { fetchTalentJobs } from "./connectors/talentConnector";
import { fetchGoogleJobs } from "./connectors/googleConnector";
import { fetchDomestikaJobs } from "./connectors/domestikaConnector";
import { fetchJoobleJobs } from "./connectors/joobleConnector";
import { fetchWeWorkRemotelyJobs } from "./connectors/weworkremotelyConnector";
import { isSpanishJob } from "./languageFilter";
import { Job, JobModality, SourcePlatform } from "@/shared/types";
import {
  getStoredJobs,
  saveStoredJobs,
  getStoredApplications,
  getStoredDismissedJobs,
  getStoredPlatforms,
  getCandidateProfile,
} from "@/modules/storage/jsonStorage";

/** Skills del candidato para calcular matchScore */
const CANDIDATE_SKILLS = [
  ...CANDIDATE_MASTER_PROFILE.skills.frontend,
  ...CANDIDATE_MASTER_PROFILE.skills.backend,
  ...CANDIDATE_MASTER_PROFILE.skills.mobile,
  ...CANDIDATE_MASTER_PROFILE.skills.testing,
  ...CANDIDATE_MASTER_PROFILE.skills.devops,
  ...CANDIDATE_MASTER_PROFILE.skills.architecture,
].map((s) => s.toLowerCase());

/** Target frontend skills para filtrado inicial */
const FRONTEND_KEYWORDS = [
  "frontend", "front-end", "front end",
  "react", "angular", "next.js", "nextjs", "vue",
  "typescript", "javascript",
  "flutter", "ionic", "react native",
  "desarrollador web", "web developer", "ui developer",
  "full stack", "fullstack", "full-stack",
];

/**
 * Calcula el matchScore (0-100) basado en la intersección
 * entre los skills del candidato y las keywords del título+descripción.
 */
/** Tecnologías frontend núcleo especificadas por el usuario */
const CORE_FRONTEND_STACK = [
  "react", "react native", "reactnative", "angular", "next.js", "nextjs",
  "ionic", "flutter", "typescript", "javascript", "frontend", "front-end", "front end"
];

/**
 * Calcula el matchScore (0-100) basado en la afinidad con el perfil del candidato.
 * Requiere que la vacante sea relevante para frontend y evalúa las tecnologías activas de su CV.
 */
function calculateMatchScore(title: string, description: string, candidateTechs: string[]): number {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const fullText = `${titleLower} ${descLower}`;

  // Lista combinada de tecnologías a buscar
  const userTechsLower = candidateTechs.map((t) => t.toLowerCase());
  const allTargetSkills = Array.from(new Set([...CORE_FRONTEND_STACK, ...userTechsLower]));

  // Verificar si contiene alguna tecnología frontend o del perfil del usuario
  const matchedCoreTechs = allTargetSkills.filter((tech) => fullText.includes(tech));
  if (matchedCoreTechs.length === 0) {
    // Si no tiene nada de frontend ni de las tecnologías del usuario, score bajo para filtrar
    return 30;
  }

  let score = 0;

  // 1. Tecnologías clave en el título (máx 35 pts)
  const hasCoreInTitle = allTargetSkills.some((tech) => titleLower.includes(tech));
  if (hasCoreInTitle) {
    score += 35;
  } else {
    score += 20; // Al menos está en la descripción
  }

  // 2. Número de tecnologías del CV del candidato que coinciden con la vacante (máx 35 pts)
  let matchedUserSkillsCount = 0;
  for (const skill of userTechsLower) {
    if (fullText.includes(skill)) {
      matchedUserSkillsCount++;
    }
  }
  // Si coinciden 3 o más tecnologías del CV del usuario = 35 pts
  score += Math.min(35, Math.round((matchedUserSkillsCount / 3) * 35));

  // 3. Modalidad Remota o Híbrida (+15 pts)
  const isRemoteOrHybrid =
    fullText.includes("remoto") ||
    fullText.includes("remote") ||
    fullText.includes("híbrido") ||
    fullText.includes("hibrido") ||
    fullText.includes("teletrabajo") ||
    fullText.includes("home office");
  if (isRemoteOrHybrid) {
    score += 15;
  }

  // 4. Español (+15 pts)
  score += 15;

  return Math.min(100, score);
}

/**
 * Detecta la modalidad de la oferta a partir del texto.
 */
function detectModality(text: string): JobModality {
  const lower = text.toLowerCase();
  if (
    lower.includes("hybrid") ||
    lower.includes("híbrido") ||
    lower.includes("hibrido")
  ) {
    return "HYBRID";
  }
  if (lower.includes("presencial") || lower.includes("onsite") || lower.includes("on-site")) {
    return "ONSITE";
  }
  return "REMOTE";
}

/**
 * Retorna las vacantes ya almacenadas sin ejecutar búsqueda.
 */
export function getIngestedJobs(): Job[] {
  return getStoredJobs();
}

/**
 * Ejecuta el pipeline de búsqueda en TODAS las plataformas.
 * Filtra por idioma español, modalidad remota/híbrida, y matchScore >= 70.
 */
export async function runIngestionPipeline(): Promise<{
  totalFetched: number;
  newJobsCount: number;
  jobs: Job[];
}> {
  const allRawJobs: RawIngestedJob[] = [];

  // 1. Obtener plataformas y empresas configuradas
  const platforms = getStoredPlatforms();
  const enabledMap = new Map(platforms.map((p) => [p.id, p.enabled]));
  const isEnabled = (id: string) => enabledMap.get(id) !== false;

  // 2. Ejecutar conectores de portales activos
  const portalPromises: Promise<RawIngestedJob[]>[] = [];

  if (isEnabled("linkedin_es")) portalPromises.push(fetchLinkedInJobs("SPAIN"));
  if (isEnabled("linkedin_co")) portalPromises.push(fetchLinkedInJobs("COLOMBIA"));
  if (isEnabled("infojobs")) portalPromises.push(fetchInfoJobsSpain());
  if (isEnabled("computrabajo")) portalPromises.push(fetchCompuTrabajoJobs());
  if (isEnabled("getonboard")) portalPromises.push(fetchGetOnBoardJobs());
  if (isEnabled("tecnoempleo")) portalPromises.push(fetchTecnoempleoJobs());
  if (isEnabled("remotive")) portalPromises.push(fetchRemotiveJobs());
  if (isEnabled("remoteok")) portalPromises.push(fetchRemoteOKJobs());
  if (isEnabled("peaku")) portalPromises.push(fetchPeakUJobs());
  if (isEnabled("torre")) portalPromises.push(fetchTorreJobs());
  if (isEnabled("manfred")) portalPromises.push(fetchManfredJobs());
  if (isEnabled("bumeran")) portalPromises.push(fetchBumeranJobs());
  if (isEnabled("empleate")) portalPromises.push(fetchEmpleateJobs());
  if (isEnabled("jobatus")) portalPromises.push(fetchJobatusJobs());
  if (isEnabled("talent")) portalPromises.push(fetchTalentJobs());
  if (isEnabled("google")) portalPromises.push(fetchGoogleJobs());
  if (isEnabled("domestika")) portalPromises.push(fetchDomestikaJobs());
  if (isEnabled("jooble")) portalPromises.push(fetchJoobleJobs());
  if (isEnabled("weworkremotely")) portalPromises.push(fetchWeWorkRemotelyJobs());

  // 3. Ejecutar ATS de empresas activas (incluye las predeterminadas y las personalizadas)
  const enabledAtsPlatforms = platforms.filter(
    (p) => p.category === "company_ats" && p.enabled && p.slug && p.ats
  );

  const companyPromises = enabledAtsPlatforms.map(async (company) => {
    const target = {
      name: company.name,
      slug: company.slug!,
      ats: company.ats!,
      region: (company.regionHint === "SPAIN" ? "SPAIN" : "LATAM") as "SPAIN" | "LATAM",
    };
    if (target.ats === "greenhouse") {
      return fetchGreenhouseJobs(target);
    }
    return fetchLeverJobs(target);
  });

  const results = await Promise.allSettled([
    ...portalPromises,
    ...companyPromises,
  ]);

  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      allRawJobs.push(...r.value);
    }
  }

  // 3. Filtrar por idioma español
  const spanishFiltered = allRawJobs.filter((raw) => {
    const spanishPlatforms: string[] = [
      "InfoJobs", "CompuTrabajo", "Tecnoempleo", "GetOnBoard",
      "PeakU", "Torre", "Manfred", "Bumeran", "Empleate",
      "Jobatus", "Talent",
    ];

    if (spanishPlatforms.includes(raw.sourcePlatform)) {
      return true;
    }

    const langCheck = isSpanishJob(raw.title, raw.rawDescription);
    return langCheck.isSpanish && !langCheck.hasEnglishDealBreaker;
  });

  // 4. Deduplicar por URL
  const seenUrls = new Set<string>();
  const uniqueRaw: RawIngestedJob[] = [];
  for (const raw of spanishFiltered) {
    const normUrl = raw.sourceUrl.toLowerCase().trim();
    if (!seenUrls.has(normUrl)) {
      seenUrls.add(normUrl);
      uniqueRaw.push(raw);
    }
  }

  // 5. Excluir ofertas ya postuladas o rechazadas
  const applications = getStoredApplications();
  const dismissed = getStoredDismissedJobs();

  const appliedUrls = new Set(
    applications.map((a) => (a.sourceUrl || "").toLowerCase().trim())
  );
  const dismissedUrls = new Set(
    dismissed
      .filter((d) => d.portalUrl)
      .map((d) => d.portalUrl!.toLowerCase().trim())
  );
  const dismissedKeys = new Set(
    dismissed.map(
      (d) =>
        `${d.company.toLowerCase().trim()}:::${d.jobTitle.toLowerCase().trim()}`
    )
  );

  const availableRaw = uniqueRaw.filter((raw) => {
    const normUrl = (raw.sourceUrl || "").toLowerCase().trim();
    const normKey = `${raw.company.toLowerCase().trim()}:::${raw.title.toLowerCase().trim()}`;

    if (dismissedUrls.has(normUrl) || dismissedKeys.has(normKey)) return false;
    if (appliedUrls.has(normUrl)) return false;
    return true;
  });

  // 6. Mapear a Job, calcular matchScore con las tecnologías del CV del candidato, filtrar por afinidad mínima configurada y solo remoto/híbrido
  const candidateProfile = getCandidateProfile();
  const candidateTechs = candidateProfile.technologies || [];
  const minThreshold = typeof candidateProfile.minMatchScore === "number" ? candidateProfile.minMatchScore : 70;

  const mappedJobs: Job[] = availableRaw
    .map((raw, index) => {
      const modality = detectModality(`${raw.location} ${raw.rawDescription}`);
      const matchScore = calculateMatchScore(raw.title, raw.rawDescription, candidateTechs);

      return {
        id: `job-${raw.sourcePlatform.toLowerCase()}-${index}-${Date.now()}`,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        country: raw.regionHint === "SPAIN" ? "España" : "LATAM",
        modality,
        stack: extractStack(raw.title, raw.rawDescription),
        description: raw.rawDescription,
        postedAt: new Date().toISOString(),
        sourceUrl: raw.sourceUrl,
        sourcePlatform: raw.sourcePlatform as SourcePlatform,
        matchScore,
        isApplied: false,
        isDismissed: false,
      };
    })
    .filter((job) => job.matchScore >= minThreshold)
    .filter((job) => job.modality !== "ONSITE");

  // 7. Persistir (combinar con vacantes existentes que aún no se hayan gestionado)
  const existingJobs = getStoredJobs().filter((j) => !j.isApplied && !j.isDismissed);
  const existingUrls = new Set(existingJobs.map((j) => j.sourceUrl.toLowerCase().trim()));
  const brandNewJobs = mappedJobs.filter((j) => !existingUrls.has(j.sourceUrl.toLowerCase().trim()));
  const allCurrentJobs = [...brandNewJobs, ...existingJobs];

  saveStoredJobs(allCurrentJobs);

  return {
    totalFetched: allRawJobs.length,
    newJobsCount: brandNewJobs.length,
    jobs: allCurrentJobs,
  };
}

/**
 * Extrae las tecnologías del stack mencionadas en el título y descripción.
 */
function extractStack(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const techKeywords = [
    "React", "Angular", "Next.js", "Vue.js", "TypeScript", "JavaScript",
    "Flutter", "Ionic", "React Native", "Node.js", "Tailwind",
    "HTML", "CSS", "SCSS", "Redux", "RxJS", "GraphQL",
    "Docker", "Git", "Jest", "Playwright",
  ];

  return techKeywords.filter((tech) => text.includes(tech.toLowerCase()));
}
