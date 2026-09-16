import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";
import { extractTechnologiesFromText } from "@/modules/cv-engine/techExtractor";

/**
 * Extrae texto aproximado de un búfer de PDF mediante inflación de streams zlib
 * y extracción de literales de texto de PDF.
 */
function extractTextFromPdfBuffer(buffer: Buffer): string {
  let extractedText = "";

  // 1. Inflar todos los streams zlib
  let start = 0;
  while ((start = buffer.indexOf("stream", start)) !== -1) {
    let streamStart = start + 6;
    if (buffer[streamStart] === 0x0d && buffer[streamStart + 1] === 0x0a) {
      streamStart += 2;
    } else if (buffer[streamStart] === 0x0a || buffer[streamStart] === 0x0d) {
      streamStart += 1;
    }
    const streamEnd = buffer.indexOf("endstream", streamStart);
    if (streamEnd === -1) break;

    const chunk = buffer.subarray(streamStart, streamEnd);
    try {
      const inflated = zlib.inflateSync(chunk).toString("utf-8");
      extractedText += " " + inflated;
    } catch {
      // Si no está comprimido o falla la inflación, probar como texto plano
      const rawStr = chunk.toString("utf-8");
      if (/[\w\s]{4,}/.test(rawStr)) {
        extractedText += " " + rawStr;
      }
    }
    start = streamEnd + 9;
  }

  // 2. Extraer cadenas legibles de texto dentro de paréntesis (cadena)Tj o [(cadena)]TJ
  const cleanTokens: string[] = [];
  const textMatches = extractedText.match(/\(([^)]+)\)\s*Tj/g) || [];
  for (const m of textMatches) {
    const inner = m.replace(/\)\s*Tj$/, "").replace(/^\(/, "");
    cleanTokens.push(inner);
  }

  // Si se encontraron tokens formales de PDF, unirlos
  if (cleanTokens.length > 10) {
    return cleanTokens.join(" ") + " " + extractedText;
  }

  // Si no, devolver el texto legible crudo
  return extractedText.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ");
}

/**
 * POST /api/profile/parse-cv
 * Recibe un archivo de CV (PDF o texto plano) o texto directo en JSON,
 * y extrae las tecnologías y datos relevantes.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let cvText = "";
    let fileName = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("cvFile") as File | null;
      const directText = formData.get("cvText") as string | null;

      if (file) {
        fileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
          cvText = extractTextFromPdfBuffer(buffer);
        } else {
          cvText = buffer.toString("utf-8");
        }
      }

      if (directText && directText.trim()) {
        cvText = (cvText + " " + directText).trim();
      }
    } else {
      const body = await request.json();
      cvText = body.cvText || "";
      fileName = body.fileName || "cv.txt";
    }

    if (!cvText || cvText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "No se pudo leer texto del archivo de CV o texto vacío" },
        { status: 400 }
      );
    }

    // Extraer tecnologías
    const detectedTechnologies = extractTechnologiesFromText(cvText);

    // Detección simple de email y teléfono si están presentes
    const emailMatch = cvText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = cvText.match(/(\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/);

    return NextResponse.json({
      success: true,
      fileName,
      detectedTechnologies,
      suggestedEmail: emailMatch ? emailMatch[0] : undefined,
      suggestedPhone: phoneMatch ? phoneMatch[0] : undefined,
      rawTextLength: cvText.length,
    });
  } catch (error) {
    console.error("Error al procesar CV:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar y extraer datos del CV" },
      { status: 500 }
    );
  }
}
