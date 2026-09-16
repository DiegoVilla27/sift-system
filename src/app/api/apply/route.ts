import { NextResponse } from "next/server";
import { executeAutoApply } from "@/modules/auto-apply/applyService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, webhookUrl } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId es requerido" }, { status: 400 });
    }

    const result = await executeAutoApply(jobId, webhookUrl);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, record: result.record });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error en postulación" },
      { status: 500 }
    );
  }
}
