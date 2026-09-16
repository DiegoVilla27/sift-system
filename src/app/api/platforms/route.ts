import { NextRequest, NextResponse } from "next/server";
import {
  getStoredPlatforms,
  saveStoredPlatforms,
  togglePlatform,
  toggleAllPlatforms,
  addCustomPlatform,
  removeCustomPlatform,
} from "@/modules/storage/jsonStorage";
import { PortalConfig } from "@/shared/types";

/**
 * GET /api/platforms
 * Retorna la lista de todas las plataformas y empresas configuradas con su estado.
 */
export async function GET() {
  try {
    const platforms = getStoredPlatforms();
    return NextResponse.json({ success: true, platforms });
  } catch (error) {
    console.error("Error al obtener plataformas:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener plataformas" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/platforms
 * Activa o desactiva un portal individual o todos a la vez.
 * Body: { id: string, enabled: boolean } O { allEnabled: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    if (typeof body.allEnabled === "boolean") {
      toggleAllPlatforms(body.allEnabled);
      const platforms = getStoredPlatforms();
      return NextResponse.json({ success: true, platforms });
    }

    const { id, enabled } = body;
    if (!id || typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Parámetros inválidos (id y enabled requeridos)" },
        { status: 400 }
      );
    }

    togglePlatform(id, enabled);
    const platforms = getStoredPlatforms();
    return NextResponse.json({ success: true, platforms });
  } catch (error) {
    console.error("Error al actualizar estado de plataforma:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar plataforma" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/platforms
 * Agrega una nueva empresa ATS o portal personalizado.
 * Body: { name, category, ats?, slug?, url?, regionHint? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, ats, slug, url, regionHint } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Nombre y categoría son obligatorios" },
        { status: 400 }
      );
    }

    if (category === "company_ats" && (!slug || !ats)) {
      return NextResponse.json(
        { success: false, error: "Para empresas ATS se requiere el slug y el tipo de ATS (greenhouse/lever)" },
        { status: 400 }
      );
    }

    const id = `custom_${Date.now()}_${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

    const newPlatform: PortalConfig = {
      id,
      name: name.trim(),
      category,
      enabled: true,
      url: url?.trim(),
      regionHint: regionHint || "SPAIN",
      ats: category === "company_ats" ? ats : undefined,
      slug: category === "company_ats" ? slug.trim().toLowerCase() : undefined,
      isCustom: true,
    };

    addCustomPlatform(newPlatform);
    const platforms = getStoredPlatforms();
    return NextResponse.json({ success: true, platform: newPlatform, platforms });
  } catch (error) {
    console.error("Error al agregar plataforma personalizada:", error);
    return NextResponse.json(
      { success: false, error: "Error al agregar la plataforma" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/platforms
 * Elimina una empresa personalizada por ID.
 * Query or Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de plataforma requerido" },
        { status: 400 }
      );
    }

    removeCustomPlatform(id);
    const platforms = getStoredPlatforms();
    return NextResponse.json({ success: true, platforms });
  } catch (error) {
    console.error("Error al eliminar plataforma personalizada:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la plataforma" },
      { status: 500 }
    );
  }
}
