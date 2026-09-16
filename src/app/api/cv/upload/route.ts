import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const cvId = formData.get("cvId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    let filename = "Diego_Villanueva_Carta_Presentacion.pdf";
    if (cvId === "CV_ES") {
      filename = "Diego_Villanueva_CV_Espana.pdf";
    } else if (cvId === "CV_CO") {
      filename = "Diego_Villanueva_CV_Colombia.pdf";
    } else if (cvId === "COVER_LETTER") {
      filename = "Diego_Villanueva_Carta_Presentacion.pdf";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar en storage/cv (para Playwright y subida de archivos ATS)
    const storageDir = path.join(process.cwd(), "storage", "cv");
    await mkdir(storageDir, { recursive: true });
    const storagePath = path.join(storageDir, filename);
    await writeFile(storagePath, buffer);

    // Guardar también en public/cv (para previsualización web y descarga directa)
    const publicDir = path.join(process.cwd(), "public", "cv");
    await mkdir(publicDir, { recursive: true });
    const publicPath = path.join(publicDir, filename);
    await writeFile(publicPath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      sizeBytes: buffer.length,
      storagePath,
      publicUrl: `/cv/${filename}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error al guardar el archivo" },
      { status: 500 }
    );
  }
}
