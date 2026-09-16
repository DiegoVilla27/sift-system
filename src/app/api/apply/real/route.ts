import { NextResponse } from "next/server";
import { runPlaywrightApplication } from "@/modules/playwright-engine/playwrightRunner";
import { sendDiscordPayload } from "@/modules/discord-alerts/discordService";
import { CVId } from "@/shared/types";

import { checkApplicationCooldown } from "@/modules/auto-apply/antiRepetitionService";
import { appendStoredApplication, markJobAsApplied } from "@/modules/storage/jsonStorage";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, jobUrl, companyName, jobTitle, cvRegion, coverLetterText, dryRun, webhookUrl } = body;

    if (!jobUrl || !companyName) {
      return NextResponse.json({ success: false, error: "jobUrl y companyName son requeridos" }, { status: 400 });
    }

    const title = jobTitle || "Frontend Developer";

    // Validar Cooldown Anti-repetición
    const cooldown = checkApplicationCooldown(companyName, title, jobUrl);
    if (!cooldown.canApply) {
      return NextResponse.json(
        { success: false, error: cooldown.reason },
        { status: 429 }
      );
    }

    const assignedCv: CVId = cvRegion === "CV_CO" ? "CV_CO" : "CV_ES";

    const result = await runPlaywrightApplication({
      jobUrl,
      companyName,
      cvRegion: assignedCv,
      coverLetterText,
      dryRun: typeof dryRun === "boolean" ? dryRun : false,
    });

    if (result.success) {
      const p = CANDIDATE_MASTER_PROFILE;
      const isES = assignedCv === "CV_ES";
      const salary = isES ? p.spain.salaryLabel : p.colombia.salaryUsdLabel;

      const resolvedJobId = jobId || `job-${Date.now()}`;
      appendStoredApplication({
        id: `app-${Date.now()}`,
        jobId: resolvedJobId,
        jobTitle: title,
        company: companyName,
        location: isES ? "España" : "Colombia / Remoto",
        modality: "REMOTE",
        cvUsed: assignedCv,
        cvLabel: isES ? "🇪🇸 CV España (DNI/NIE)" : "🇨🇴 CV Colombia (Cédula)",
        appliedAt: new Date().toISOString(),
        status: "SUCCESS",
        stage: "APPLIED",
        matchScore: 90,
        salary,
        sourcePlatform: result.platform,
        portalUrl: jobUrl,
        logs: result.logs.map((msg, i) => ({
          timestamp: new Date().toLocaleTimeString(),
          level: "INFO",
          message: msg,
        })),
      });

      markJobAsApplied(resolvedJobId, jobUrl);
    }

    // Enviar notificación enriquecida a Discord
    const cvTag = assignedCv === "CV_ES" ? "🇪🇸 CV España (Valencia, EUR)" : "🇨🇴 CV Colombia (Armenia, USD)";
    const modeTag = result.dryRun ? "🛡️ Verificación Segura (Dry-Run)" : "🚀 Postulación Enviada (Producción)";

    await sendDiscordPayload(
      {
        embeds: [
          {
            title: `${modeTag}: ${companyName}`,
            description: result.success
              ? `El motor Playwright completó la navegación y rellenado de campos con éxito en **${result.platform} ATS**.`
              : `Ocurrió un inconveniente durante el proceso: ${result.error}`,
            color: result.success ? 1096065 : 15158332,
            fields: [
              { name: "🏢 Empresa", value: companyName, inline: true },
              { name: "📄 Archivo CV", value: result.pdfAttached, inline: true },
              { name: "📍 Región CV", value: cvTag, inline: false },
              { name: "🛠️ Campos Rellenados", value: result.filledFields.join(", ") || "Ninguno", inline: false },
              { name: "🔗 URL Vacante", value: jobUrl, inline: false },
            ],
            footer: { text: "Sift System • Playwright Headless Automation" },
            timestamp: new Date().toISOString(),
          },
        ],
      },
      webhookUrl
    ).catch(() => {});

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error ejecutando Playwright" },
      { status: 500 }
    );
  }
}
