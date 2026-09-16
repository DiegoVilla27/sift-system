import { NextRequest, NextResponse } from "next/server";
import { dismissJob } from "@/modules/storage/jsonStorage";

/**
 * POST /api/jobs/dismiss
 * Rechaza una vacante para que no aparezca de nuevo.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, company, title, sourceUrl } = body;

    if (!jobId || !company || !title) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: jobId, company, title" },
        { status: 400 }
      );
    }

    dismissJob({
      jobId,
      company,
      jobTitle: title,
      portalUrl: sourceUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al rechazar vacante:", error);
    return NextResponse.json(
      { success: false, error: "Error al rechazar la vacante" },
      { status: 500 }
    );
  }
}
