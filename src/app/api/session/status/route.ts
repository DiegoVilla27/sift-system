import { NextResponse } from "next/server";
import {
  getSessionStatuses,
  deleteSession,
  PlatformId,
} from "@/modules/playwright-engine/sessionManager";

export async function GET() {
  try {
    const statuses = getSessionStatuses();
    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al consultar sesiones" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { platformId } = body as { platformId: PlatformId };

    if (!platformId) {
      return NextResponse.json(
        { success: false, error: "platformId es requerido" },
        { status: 400 }
      );
    }

    const deleted = deleteSession(platformId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al eliminar sesión" },
      { status: 500 }
    );
  }
}
