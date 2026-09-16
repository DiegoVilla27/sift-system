import { NextResponse } from "next/server";
import {
  dismissJob,
  undismissJob,
  getStoredDismissedJobs,
} from "@/modules/storage/jsonStorage";

export async function GET() {
  try {
    const dismissed = getStoredDismissedJobs();
    return NextResponse.json({ success: true, dismissed });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al obtener ofertas descartadas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, company, title, sourceUrl, reason } = body;

    if (!jobId || !company || !title) {
      return NextResponse.json(
        { success: false, error: "jobId, company y title son obligatorios" },
        { status: 400 }
      );
    }

    dismissJob({
      jobId,
      company,
      jobTitle: title,
      portalUrl: sourceUrl,
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Oferta en ${company} descartada correctamente`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al descartar la oferta" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "jobId es requerido" }, { status: 400 });
    }

    undismissJob(jobId);

    return NextResponse.json({
      success: true,
      message: "Oferta restaurada a disponibles",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al restaurar oferta" },
      { status: 500 }
    );
  }
}
