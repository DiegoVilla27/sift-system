import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import path from "path";

export async function GET() {
  const files = [
    { id: "CV_ES", filename: "Diego_Villanueva_CV_Espana.pdf" },
    { id: "CV_CO", filename: "Diego_Villanueva_CV_Colombia.pdf" },
    { id: "COVER_LETTER", filename: "Diego_Villanueva_Carta_Presentacion.pdf" },
  ];

  const results: Record<string, { exists: boolean; sizeBytes: number; path: string }> = {};

  for (const f of files) {
    const filePath = path.join(process.cwd(), "storage", "cv", f.filename);
    try {
      const info = await stat(filePath);
      results[f.id] = { exists: true, sizeBytes: info.size, path: filePath };
    } catch {
      results[f.id] = { exists: false, sizeBytes: 0, path: filePath };
    }
  }

  return NextResponse.json({ success: true, cvs: results });
}
