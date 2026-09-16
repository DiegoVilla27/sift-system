import { Job, CVId } from "@/shared/types";
import { DiscordWebhookPayload, DiscordEmbed } from "./types";

export const DEFAULT_DISCORD_WEBHOOK =
  process.env.DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1549418546327593121/9EimY7LwrpwmlQU1UaZWOdpHMUzeKE-1N79WVaLXViozAdWLCAhJFabrOHVCMyhOb76U";

/**
 * Envía una notificación enriquecida con Embed a Discord mediante Webhook
 */
export async function sendDiscordPayload(
  payload: DiscordWebhookPayload,
  webhookUrl: string = DEFAULT_DISCORD_WEBHOOK
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Sift System AI Scout",
        avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80",
        ...payload,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al conectar con Discord",
    };
  }
}

/**
 * Genera y envía un Embed completo de vacante con Match IA y postulación automática
 */
export async function notifyJobFound(
  job: Job,
  webhookUrl: string = DEFAULT_DISCORD_WEBHOOK,
  isAutoApplied: boolean = true
) {
  const isHighMatch = job.matchScore >= 85;
  // Colores Discord (formato decimal entero)
  // Verde Esmeralda = 0x10B981 (1096065)
  // Amarillo Ámbar = 0xF59E0B (16096779)
  const embedColor = isHighMatch ? 1096065 : 16096779;

  const cvTag =
    job.assignedCvId === "CV_ES"
      ? "🇪🇸 CV España (DNI/NIE)"
      : "🇨🇴 CV Colombia (Cédula/LATAM)";

  const modalityTag =
    job.modality === "REMOTE" ? "🌐 100% Remoto" : "🏢 Híbrido";

  const salaryTag = job.salaryRange
    ? `${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} ${job.salaryRange.currency}`
    : "No especificado";

  const statusText = isAutoApplied
    ? "✅ Postulación 100% Automatizada Completada"
    : "⏳ Listo para postular automáticamente";

  const embed: DiscordEmbed = {
    title: `⚡ [${job.matchScore}% Match] ${job.title} en ${job.company}`,
    url: job.sourceUrl,
    description: `Se detectó una nueva oportunidad con alta afinidad técnica. El sistema ha procesado la vacante y aplicado la regla regional de CV.\n\n**Justificación IA:** ${job.matchReasons.slice(0, 2).join(" • ")}`,
    color: embedColor,
    fields: [
      { name: "🏢 Empresa", value: job.company, inline: true },
      { name: "📍 Ubicación", value: `${job.location} (${modalityTag})`, inline: true },
      { name: "📄 CV Utilizado", value: `**${cvTag}**\n*${job.cvAssignmentReason}*`, inline: false },
      { name: "🛠️ Stack Requerido", value: job.stack.slice(0, 5).join(", "), inline: true },
      { name: "💰 Rango Salarial", value: salaryTag, inline: true },
      { name: "🚀 Estado", value: `**${statusText}**`, inline: false },
    ],
    footer: {
      text: "Sift System • 100% Autonomous Job Search & Apply",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordPayload({ embeds: [embed] }, webhookUrl);
}

/**
 * Envía un mensaje de prueba de webhook a Discord para validar la conexión
 */
export async function sendTestWebhookNotification(webhookUrl: string = DEFAULT_DISCORD_WEBHOOK) {
  const embed: DiscordEmbed = {
    title: "🚀 Conexión Exitosa con Sift System",
    description:
      "Tu canal de Discord ha sido enlazado exitosamente al **Sift System**. A partir de ahora recibirás alertas en tiempo real de ofertas laborales de Frontend (Remoto e Híbrido) con scoring de afinidad y registro de CV despachada (España vs Colombia).",
    color: 3900150, // Azul #3B82F6
    fields: [
      { name: "📡 Canal Activo", value: "Alertas Frontend Match & Auto-Apply", inline: true },
      { name: "🎯 Umbral Mínimo", value: "≥ 75% Score", inline: true },
      { name: "🇪🇸 / 🇨🇴 Motor CV", value: "Despacho Dual Activo (0% Errores)", inline: false },
    ],
    footer: {
      text: "Sift System • Verificación de Webhook",
    },
    timestamp: new Date().toISOString(),
  };

  return sendDiscordPayload({ embeds: [embed] }, webhookUrl);
}
