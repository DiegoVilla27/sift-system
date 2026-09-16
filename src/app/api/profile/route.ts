import { NextRequest, NextResponse } from "next/server";
import {
  getCandidateProfile,
  saveCandidateProfile,
} from "@/modules/storage/jsonStorage";
import { CandidateProfile } from "@/shared/types";

/**
 * GET /api/profile
 * Retorna el perfil del candidato y sus tecnologías activas.
 */
export async function GET() {
  try {
    const profile = getCandidateProfile();
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("Error al obtener perfil del candidato:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile
 * Actualiza el perfil y las tecnologías del candidato.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, location, roleTitle, yearsOfExperience, technologies, minMatchScore, cvFileName, cvText } = body;

    if (!fullName || !Array.isArray(technologies)) {
      return NextResponse.json(
        { success: false, error: "Nombre completo y lista de tecnologías son requeridos" },
        { status: 400 }
      );
    }

    const updatedProfile: CandidateProfile = {
      fullName: fullName.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      location: location?.trim() || "",
      roleTitle: roleTitle?.trim() || "Frontend Developer",
      yearsOfExperience: Number(yearsOfExperience) || 0,
      technologies: Array.from(new Set(technologies.map((t: string) => t.trim()))).filter(Boolean),
      minMatchScore: typeof minMatchScore === "number" ? Math.max(10, Math.min(100, minMatchScore)) : 70,
      cvFileName: cvFileName || undefined,
      cvText: cvText || undefined,
      lastUpdated: new Date().toISOString(),
    };

    saveCandidateProfile(updatedProfile);

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Error al guardar perfil del candidato:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar perfil" },
      { status: 500 }
    );
  }
}
