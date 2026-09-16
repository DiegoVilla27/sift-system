import { NextResponse } from "next/server";
import { getJobs } from "@/modules/jobs/jobsService";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || undefined;
  const modality = (searchParams.get("modality") as any) || undefined;
  const region = (searchParams.get("region") as any) || undefined;
  const assignedCvId = (searchParams.get("assignedCvId") as any) || undefined;
  const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
  const statusParam = searchParams.get("status")?.toUpperCase();
  const status =
    statusParam === "ALL" || statusParam === "APPLIED" || statusParam === "DISMISSED" || statusParam === "AVAILABLE"
      ? (statusParam as any)
      : "AVAILABLE";

  const jobs = getJobs({ query, modality, region, assignedCvId, minScore, status });
  return NextResponse.json({ jobs });
}
