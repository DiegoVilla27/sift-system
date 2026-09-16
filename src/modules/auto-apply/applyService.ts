import { ApplicationRecord, Job, CVId } from "@/shared/types";
import { getJobById } from "@/modules/jobs/jobsService";
import { notifyJobFound } from "@/modules/discord-alerts/discordService";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";
import {
  getStoredApplications,
  appendStoredApplication,
  markJobAsApplied,
} from "@/modules/storage/jsonStorage";
import { checkApplicationCooldown } from "./antiRepetitionService";
import { runPlaywrightApplication } from "@/modules/playwright-engine/playwrightRunner";

export function getApplications(): ApplicationRecord[] {
  return getStoredApplications();
}

/**
 * Ejecuta la postulación 100% automatizada con Playwright sobre una vacante y la persiste
 */
export async function executeAutoApply(
  jobId: string,
  webhookUrl?: string
): Promise<{ success: boolean; record?: ApplicationRecord; error?: string }> {
  const job = getJobById(jobId);
  if (!job) {
    return { success: false, error: "Vacante no encontrada" };
  }

  // Comprobar filtro anti-repetición y cooldown
  const cooldown = checkApplicationCooldown(job.company, job.title, job.sourceUrl);
  if (!cooldown.canApply) {
    return { success: false, error: cooldown.reason };
  }

  const p = CANDIDATE_MASTER_PROFILE;
  const isES = job.assignedCvId === "CV_ES";
  const cvLabel = isES ? "🇪🇸 CV España (DNI/NIE)" : "🇨🇴 CV Colombia (Cédula/LATAM)";
  const salaryExpected = isES ? p.spain.salaryLabel : p.colombia.salaryUsdLabel;

  // Ejecutar Playwright real en producción
  const pwResult = await runPlaywrightApplication({
    jobUrl: job.sourceUrl,
    companyName: job.company,
    cvRegion: job.assignedCvId,
    coverLetterText: job.generatedCoverLetter,
    dryRun: false,
  });

  if (!pwResult.success) {
    return {
      success: false,
      error: pwResult.error || "No se pudo completar la postulación en el portal web",
    };
  }

  const now = new Date();
  const newRecord: ApplicationRecord = {
    id: `app-${Date.now()}`,
    jobId: job.id,
    jobTitle: job.title,
    company: job.company,
    location: job.location,
    modality: job.modality,
    cvUsed: job.assignedCvId,
    cvLabel: cvLabel,
    appliedAt: now.toISOString(),
    status: "SUCCESS",
    stage: "APPLIED",
    matchScore: job.matchScore,
    salary: salaryExpected,
    sourcePlatform: pwResult.platform,
    portalUrl: job.sourceUrl,
    logs: pwResult.logs.map((msg) => ({
      timestamp: new Date().toLocaleTimeString(),
      level: "INFO",
      message: msg,
    })),
  };

  // Guardar persistentemente en storage/applications.json y marcar en jobs.json
  appendStoredApplication(newRecord);
  markJobAsApplied(job.id, job.sourceUrl);

  job.isApplied = true;
  job.appliedAt = newRecord.appliedAt;
  job.applicationStatus = "SUCCESS";

  // Disparar notificación automática a Discord
  try {
    await notifyJobFound(job, webhookUrl, true);
  } catch (err) {
    console.error("Error enviando alerta a Discord:", err);
  }

  return { success: true, record: newRecord };
}
