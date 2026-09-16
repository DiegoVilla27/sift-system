import { runIngestionPipeline, getIngestedJobs } from "@/modules/ingestion/ingestionService";
import { getStoredSettings } from "@/modules/storage/jsonStorage";
import { checkApplicationCooldown } from "@/modules/auto-apply/antiRepetitionService";
import { runPlaywrightApplication } from "@/modules/playwright-engine/playwrightRunner";
import { sendDiscordPayload } from "@/modules/discord-alerts/discordService";
import { appendStoredApplication } from "@/modules/storage/jsonStorage";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";

interface SchedulerState {
  isActive: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalCycles: number;
  lastSummary: string | null;
}

let state: SchedulerState = {
  isActive: true,
  intervalHours: 4,
  lastRunAt: null,
  nextRunAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
  totalCycles: 0,
  lastSummary: null,
};

let schedulerTimer: NodeJS.Timeout | null = null;

export function getSchedulerState(): SchedulerState {
  return state;
}

export async function executeSchedulerTick(): Promise<{
  success: boolean;
  jobsProcessed: number;
  appliedCount: number;
  summary: string;
}> {
  state.totalCycles++;
  state.lastRunAt = new Date().toISOString();
  state.nextRunAt = new Date(Date.now() + state.intervalHours * 3600 * 1000).toISOString();

  try {
    // 1. Ingesta multi-plataforma
    const ingestionResult = await runIngestionPipeline();
    const settings = getStoredSettings();
    const minScore = settings.minScore || 70;

    // 2. Filtrar por afinidad >= minScore y que no estén en cooldown
    const eligibleJobs = ingestionResult.jobs.filter((j) => {
      if (j.matchScore < minScore) return false;
      const cooldown = checkApplicationCooldown(j.company, j.title, j.sourceUrl);
      return cooldown.canApply;
    });

    let appliedCount = 0;

    // 3. Postulación automática (máximo 2 por ciclo para seguridad)
    if (settings.autoApplyEnabled && eligibleJobs.length > 0) {
      const candidatesToApply = eligibleJobs.slice(0, 2);

      for (const job of candidatesToApply) {
        try {
          const result = await runPlaywrightApplication({
            jobUrl: job.sourceUrl,
            companyName: job.company,
            cvRegion: job.assignedCvId,
            coverLetterText: job.generatedCoverLetter,
            dryRun: false, // Envío real desatendido
          });

          if (result.success) {
            appliedCount++;
            const p = CANDIDATE_MASTER_PROFILE;
            const isES = job.assignedCvId === "CV_ES";
            const salary = isES ? p.spain.salaryLabel : p.colombia.salaryUsdLabel;

            appendStoredApplication({
              id: `app-cron-${Date.now()}`,
              jobId: job.id,
              jobTitle: job.title,
              company: job.company,
              location: job.location,
              modality: job.modality,
              cvUsed: job.assignedCvId,
              cvLabel: isES ? "🇪🇸 CV España (DNI/NIE)" : "🇨🇴 CV Colombia (Cédula)",
              appliedAt: new Date().toISOString(),
              status: "SUCCESS",
              stage: "APPLIED",
              matchScore: job.matchScore,
              salary,
              sourcePlatform: result.platform,
              portalUrl: job.sourceUrl,
              logs: result.logs.map((msg) => ({
                timestamp: new Date().toLocaleTimeString(),
                level: "INFO",
                message: msg,
              })),
            });
          }
        } catch (err) {
          console.error("Error auto-aplicando en scheduler:", err);
        }
      }
    }

    const summary = `Ciclo completado: ${ingestionResult.newJobsCount} vacantes analizadas, ${eligibleJobs.length} con afinidad ≥${minScore}%, ${appliedCount} postulaciones enviadas automáticamente.`;
    state.lastSummary = summary;

    // 4. Notificar a Discord
    await sendDiscordPayload(
      {
        embeds: [
          {
            title: "⏰ Sift System • Ciclo Desatendido en Segundo Plano",
            description: summary,
            color: 3447003,
            fields: [
              { name: "📡 Total Vacantes", value: `${ingestionResult.newJobsCount} analizadas`, inline: true },
              { name: "🎯 Afinidad ≥" + minScore + "%", value: `${eligibleJobs.length} aptas`, inline: true },
              { name: "🚀 Postuladas Auto", value: `${appliedCount} formularios`, inline: true },
              { name: "⏳ Próximo Ciclo", value: `En ${state.intervalHours} horas`, inline: false },
            ],
            footer: { text: "Sift System • Cron 24/7" },
            timestamp: new Date().toISOString(),
          },
        ],
      },
      settings.webhookUrl
    ).catch(() => {});

    return {
      success: true,
      jobsProcessed: ingestionResult.newJobsCount,
      appliedCount,
      summary,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error en ciclo desatendido";
    state.lastSummary = `Error: ${errMsg}`;
    return {
      success: false,
      jobsProcessed: 0,
      appliedCount: 0,
      summary: errMsg,
    };
  }
}

export function startScheduler(intervalHours = 4) {
  state.isActive = true;
  state.intervalHours = intervalHours;
  state.nextRunAt = new Date(Date.now() + intervalHours * 3600 * 1000).toISOString();

  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(executeSchedulerTick, intervalHours * 3600 * 1000);
}

export function stopScheduler() {
  state.isActive = false;
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
