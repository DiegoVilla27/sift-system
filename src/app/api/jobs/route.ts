import { NextResponse } from "next/server";
import { getStoredJobs } from "@/modules/storage/jsonStorage";

/**
 * GET /api/jobs
 * Retorna las vacantes disponibles (no postuladas, no rechazadas).
 */
export async function GET() {
  try {
    const jobs = getStoredJobs();
    const available = jobs.filter((j) => !j.isApplied && !j.isDismissed);
    return NextResponse.json({ success: true, jobs: available });
  } catch (error) {
    console.error("Error al leer vacantes:", error);
    return NextResponse.json(
      { success: false, error: "Error al leer vacantes" },
      { status: 500 }
    );
  }
}
