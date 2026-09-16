import { NextResponse } from "next/server";
import {
  launchInteractiveLogin,
  PlatformId,
} from "@/modules/playwright-engine/sessionManager";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { platformId } = body as { platformId: PlatformId };

    if (!platformId) {
      return NextResponse.json(
        { success: false, message: "platformId es requerido" },
        { status: 400 }
      );
    }

    // Launch interactive login window
    const result = await launchInteractiveLogin(platformId);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error al iniciar sesión interactiva",
      },
      { status: 500 }
    );
  }
}
