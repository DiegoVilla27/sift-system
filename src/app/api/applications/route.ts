import { NextRequest, NextResponse } from "next/server";
import {
  getStoredApplications,
  appendApplication,
  updateApplicationStage,
  addTrackingNote,
} from "@/modules/storage/jsonStorage";
import { PostulacionRecord, ApplicationStage } from "@/shared/types";

/**
 * GET /api/applications
 * Retorna todas las postulaciones registradas.
 */
export async function GET() {
  try {
    const applications = getStoredApplications();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Error al leer postulaciones:", error);
    return NextResponse.json(
      { success: false, error: "Error al leer postulaciones" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applications
 * Registra una nueva postulación (mover vacante de "disponibles" a "postuladas").
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, jobTitle, company, location, modality, sourceUrl, sourcePlatform, salaryRange } = body;

    if (!jobId || !jobTitle || !company) {
      return NextResponse.json(
        { success: false, error: "Faltan campos requeridos: jobId, jobTitle, company" },
        { status: 400 }
      );
    }

    const record: PostulacionRecord = {
      id: `app-${Date.now()}`,
      jobId,
      jobTitle,
      company,
      location: location || "",
      modality: modality || "REMOTE",
      sourceUrl: sourceUrl || "",
      sourcePlatform: sourcePlatform || "Other",
      appliedAt: new Date().toISOString(),
      stage: "POSTULADA",
      salaryRange: salaryRange || undefined,
      trackingNotes: [],
    };

    appendApplication(record);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Error al crear postulación:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar la postulación" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/applications
 * Actualiza la etapa o agrega una nota de seguimiento a una postulación.
 * Body: { appId, stage?, note? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, stage, note } = body;

    if (!appId) {
      return NextResponse.json(
        { success: false, error: "Se requiere appId" },
        { status: 400 }
      );
    }

    // Actualizar etapa si se proporcionó
    if (stage) {
      updateApplicationStage(appId, stage as ApplicationStage);
    }

    // Agregar nota de seguimiento si se proporcionó
    let newNote = null;
    if (note && typeof note === "string" && note.trim()) {
      newNote = addTrackingNote(appId, note.trim());
    }

    return NextResponse.json({ success: true, note: newNote });
  } catch (error) {
    console.error("Error al actualizar postulación:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la postulación" },
      { status: 500 }
    );
  }
}
