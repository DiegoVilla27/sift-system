import { NextResponse } from "next/server";
import { sendTestWebhookNotification } from "@/modules/discord-alerts/discordService";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const webhookUrl = body.webhookUrl;

    const result = await sendTestWebhookNotification(webhookUrl);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Mensaje de prueba enviado a Discord correctamente" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
