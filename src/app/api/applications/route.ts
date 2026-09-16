import { NextResponse } from "next/server";
import {
  getStoredApplications,
  appendStoredApplication,
  saveStoredApplications,
  markJobAsApplied,
} from "@/modules/storage/jsonStorage";
import { ApplicationRecord } from "@/shared/types";

export async function GET() {
  const applications = getStoredApplications();
  return NextResponse.json({ success: true, applications });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      jobId,
      jobTitle,
      company,
      location,
      modality,
      cvUsed,
      salary,
      sourcePlatform,
      portalUrl,
      notes,
    } = body;

    const isES = cvUsed === "CV_ES";
    const cvLabel = isES ? "🇪🇸 CV España (DNI/NIE)" : "🇨🇴 CV Colombia (Cédula)";
    const defaultSalary = isES ? "30.000 € / año bruto" : "5.000.000 COP / mes";

    const newRecord: ApplicationRecord = {
      id: body.id || `app-manual-${Date.now()}`,
      jobId: jobId || `job-manual-${Date.now()}`,
      jobTitle: jobTitle || "Frontend Developer",
      company: company || "Empresa",
      location: location || (isES ? "España" : "Colombia / Remoto"),
      modality: modality || "REMOTE",
      cvUsed: cvUsed || (isES ? "CV_ES" : "CV_CO"),
      cvLabel: body.cvLabel || cvLabel,
      appliedAt: body.appliedAt || new Date().toISOString(),
      status: "SUCCESS",
      stage: body.stage || "APPLIED",
      matchScore: body.matchScore || 90,
      salary: salary || defaultSalary,
      sourcePlatform: sourcePlatform || "Manual",
      portalUrl: portalUrl || "",
      notes: notes || "Postulación manual confirmada directamente por Diego",
      logs: body.logs || [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: "SUCCESS",
          message: "Postulación manual registrada y confirmada por el usuario.",
        },
      ],
    };

    appendStoredApplication(newRecord);

    if (jobId || portalUrl) {
      markJobAsApplied(jobId || "", portalUrl);
    }

    return NextResponse.json({ success: true, record: newRecord });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al registrar postulación" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { appId, stage, notes } = body;

    if (!appId) {
      return NextResponse.json({ success: false, error: "appId es requerido" }, { status: 400 });
    }

    const applications = getStoredApplications();
    const target = applications.find((a) => a.id === appId);

    if (!target) {
      return NextResponse.json({ success: false, error: "Postulación no encontrada" }, { status: 404 });
    }

    if (stage) target.stage = stage;
    if (typeof notes === "string") target.notes = notes;

    saveStoredApplications(applications);
    return NextResponse.json({ success: true, application: target });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al actualizar postulación" },
      { status: 500 }
    );
  }
}
