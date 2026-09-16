import { NextResponse } from "next/server";
import {
  getIngestedJobs,
  runIngestionPipeline,
} from "@/modules/ingestion/ingestionService";

/**
 * GET /api/ingestion/run
 * Retorna las vacantes ya almacenadas en disco.
 */
export async function GET() {
  try {
    const jobs = getIngestedJobs();
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Error al leer vacantes:", error);
    return NextResponse.json(
      { success: false, error: "Error al leer vacantes almacenadas" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ingestion/run
 * Ejecuta la búsqueda masiva en TODAS las plataformas.
 */
export async function POST() {
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json({
      success: true,
      totalFetched: result.totalFetched,
      newJobsCount: result.newJobsCount,
      jobs: result.jobs,
    });
  } catch (error) {
    console.error("Error en pipeline de ingesta:", error);
    return NextResponse.json(
      { success: false, error: "Error al buscar vacantes en las plataformas" },
      { status: 500 }
    );
  }
}
