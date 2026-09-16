import { NextResponse } from "next/server";
import { runIngestionPipeline, getIngestedJobs } from "@/modules/ingestion/ingestionService";

export async function GET() {
  const jobs = getIngestedJobs();
  return NextResponse.json({ success: true, count: jobs.length, jobs });
}

export async function POST() {
  try {
    const result = await runIngestionPipeline();
    return NextResponse.json({
      success: true,
      message: `Ingesta completada: ${result.newJobsCount} vacantes de Frontend extraídas en tiempo real.`,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error durante la ingesta" },
      { status: 500 }
    );
  }
}
