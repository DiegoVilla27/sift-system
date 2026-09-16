import { TARGET_COMPANIES } from "./companyRegistry";
import { fetchGreenhouseJobs, RawIngestedJob } from "./connectors/greenhouseConnector";
import { fetchLeverJobs } from "./connectors/leverConnector";
import { fetchLinkedInJobs } from "./connectors/linkedinConnector";
import { fetchInfoJobsSpain } from "./connectors/infojobsConnector";
import { fetchCompuTrabajoJobs } from "./connectors/computrabajoConnector";
import { fetchGetOnBoardJobs } from "./connectors/getonboardConnector";
import { fetchTecnoempleoJobs } from "./connectors/tecnoempleoConnector";
import { isSpanishJob } from "./languageFilter";
import { dispatchCv } from "@/modules/cv-engine/cvDispatcher";
import { Job, JobModality } from "@/shared/types";
import {
  getStoredJobs,
  saveStoredJobs,
  getStoredApplications,
  getStoredDismissedJobs,
} from "@/modules/storage/jsonStorage";

export function getIngestedJobs(): Job[] {
  return getStoredJobs();
}

export async function runIngestionPipeline(): Promise<{
  totalFetched: number;
  newJobsCount: number;
  jobs: Job[];
}> {
  const allRawJobs: RawIngestedJob[] = [];

  // 1. Portales prioritarios en Español (LinkedIn, InfoJobs, CompuTrabajo, Get on Board, Tecnoempleo)
  const portalPromises = [
    fetchLinkedInJobs("SPAIN"),
    fetchLinkedInJobs("COLOMBIA"),
    fetchInfoJobsSpain(),
    fetchCompuTrabajoJobs(),
    fetchGetOnBoardJobs(),
    fetchTecnoempleoJobs(),
  ];

  // 2. ATS de empresas hispanohablantes (Greenhouse & Lever)
  const companyPromises = TARGET_COMPANIES.map(async (company) => {
    if (company.ats === "greenhouse") {
      return fetchGreenhouseJobs(company);
    } else {
      return fetchLeverJobs(company);
    }
  });

  const results = await Promise.allSettled([...portalPromises, ...companyPromises]);

  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) {
      allRawJobs.push(...r.value);
    }
  }

  // 3. Filtrar estrictamente por idioma Español y descartar inglés obligatorio
  const spanishFilteredJobs = allRawJobs.filter((raw) => {
    // Si viene de InfoJobs, CompuTrabajo, Tecnoempleo o Get on Board, está en español
    if (
      raw.sourcePlatform === "InfoJobs" ||
      raw.sourcePlatform === "Other" ||
      raw.sourcePlatform === "Tecnoempleo" ||
      raw.sourcePlatform === "GetOnBoard"
    ) {
      return true;
    }
    // Para LinkedIn y ATS internacionales, verificar idioma
    const langCheck = isSpanishJob(raw.title, raw.rawDescription);
    return langCheck.isSpanish && !langCheck.hasEnglishDealBreaker;
  });

  // 4. Deduplicar por sourceUrl
  const seenUrls = new Set<string>();
  const uniqueRaw: RawIngestedJob[] = [];

  for (const raw of spanishFilteredJobs) {
    if (!seenUrls.has(raw.sourceUrl)) {
      seenUrls.add(raw.sourceUrl);
      uniqueRaw.push(raw);
    }
  }

  // 5. Mapear a la interfaz Job y asignar CV geográfico sin error
  // 5. Excluir ofertas ya postuladas y ofertas ya descartadas permanentemente
  const existingApps = getStoredApplications();
  const existingDismissed = getStoredDismissedJobs();

  const appliedUrls = new Set(existingApps.map((a) => (a.portalUrl || "").toLowerCase().trim()));
  const appliedKeys = new Set(
    existingApps.map((a) => `${a.company.toLowerCase().trim()}:::${a.jobTitle.toLowerCase().trim()}`)
  );

  const dismissedUrls = new Set(
    existingDismissed.filter((d) => d.portalUrl).map((d) => d.portalUrl!.toLowerCase().trim())
  );
  const dismissedKeys = new Set(
    existingDismissed.map((d) => `${d.company.toLowerCase().trim()}:::${d.jobTitle.toLowerCase().trim()}`)
  );

  const availableRaw = uniqueRaw.filter((raw) => {
    const normUrl = (raw.sourceUrl || "").toLowerCase().trim();
    const normKey = `${raw.company.toLowerCase().trim()}:::${raw.title.toLowerCase().trim()}`;

    // Si ya está descartada por Diego, filtrarla para no mostrarla nunca más
    if (dismissedUrls.has(normUrl) || dismissedKeys.has(normKey)) {
      return false;
    }
    // Si ya está postulada, excluirla de las vacantes activas
    if (appliedUrls.has(normUrl) || appliedKeys.has(normKey)) {
      return false;
    }
    return true;
  });

  const mappedJobs: Job[] = availableRaw.map((raw, index) => {
    const locLower = raw.location.toLowerCase();
    let modality: JobModality = "REMOTE";
    if (locLower.includes("hybrid") || locLower.includes("híbrido") || locLower.includes("hibrido")) {
      modality = "HYBRID";
    } else if (locLower.includes("presencial") || locLower.includes("onsite")) {
      modality = "ONSITE";
    }

    const cvDispatch = dispatchCv({
      title: raw.title,
      company: raw.company,
      location: raw.location,
      description: raw.rawDescription,
    });

    return {
      id: `job-${raw.sourcePlatform.toLowerCase()}-${index + 1}-${Date.now()}`,
      title: raw.title,
      company: raw.company,
      location: raw.location,
      country: cvDispatch.targetRegion === "SPAIN" ? "España" : "Colombia",
      modality,
      region: cvDispatch.targetRegion,
      stack: ["React", "TypeScript", "Angular", "Next.js"],
      description: raw.rawDescription,
      postedAt: new Date().toISOString(),
      sourceUrl: raw.sourceUrl,
      sourcePlatform: raw.sourcePlatform,
      matchScore: 90,
      matchReasons: [
        `Oferta en Español para perfil Frontend (${raw.sourcePlatform})`,
        `Despacho regional asignado: ${cvDispatch.reason}`,
      ],
      keyPros: ["100% en Español", `Portal: ${raw.sourcePlatform}`, `Ubicación: ${raw.location}`],
      generatedCoverLetter: `Estimado equipo de selección de ${raw.company},\n\nMi nombre es Diego Villanueva, Ingeniero de Sistemas con más de 8 años de experiencia en desarrollo Frontend con Angular, React, Next.js y TypeScript...\n\nAtentamente,\nDiego Villanueva`,
      assignedCvId: cvDispatch.assignedCvId,
      cvAssignmentReason: cvDispatch.reason,
      cvAssignmentConfidence: cvDispatch.confidence,
      isApplied: false,
      isDismissed: false,
      applicationStatus: "QUEUED",
    };
  });

  // Guardar en el almacenamiento persistente
  saveStoredJobs(mappedJobs);

  return {
    totalFetched: allRawJobs.length,
    newJobsCount: mappedJobs.length,
    jobs: mappedJobs,
  };
}
