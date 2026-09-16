import { NextResponse } from "next/server";
import { getStoredSettings, saveStoredSettings } from "@/modules/storage/jsonStorage";

export async function GET() {
  const settings = getStoredSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    saveStoredSettings(body);
    return NextResponse.json({ success: true, message: "Configuración persistida correctamente", settings: body });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al guardar configuración" },
      { status: 500 }
    );
  }
}
