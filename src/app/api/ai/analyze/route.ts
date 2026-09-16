import { NextResponse } from "next/server";
import { analyzeJobWithGemini } from "@/modules/ai-pipeline/jobAnalyzer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, company, location, description } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: "title y description son requeridos" }, { status: 400 });
    }

    const analysis = await analyzeJobWithGemini({
      title,
      company: company || "Empresa Confidencial",
      location: location || "Remote",
      description,
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al analizar vacante con IA" },
      { status: 500 }
    );
  }
}
