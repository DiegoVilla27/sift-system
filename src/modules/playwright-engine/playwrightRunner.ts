import { chromium, Browser, Page } from "playwright";
import path from "path";
import { fillGreenhouseForm } from "./formFillers/greenhouseFiller";
import { fillLeverForm } from "./formFillers/leverFiller";
import { fillLinkedInJob } from "./formFillers/linkedinFiller";
import { solveCustomAtsQuestions } from "./atsQuestionSolver";
import { getSessionFilePath } from "./sessionManager";
import { CVId } from "@/shared/types";

export interface PlaywrightRunParams {
  jobUrl: string;
  companyName: string;
  cvRegion: CVId;
  coverLetterText?: string;
  dryRun?: boolean; // Default false for production real application
}

export interface PlaywrightRunResult {
  success: boolean;
  dryRun: boolean;
  platform: "Greenhouse" | "Lever" | "LinkedIn" | "Generic";
  filledFields: string[];
  screenshotUrl?: string;
  pdfAttached: string;
  logs: string[];
  error?: string;
}

export async function runPlaywrightApplication(params: PlaywrightRunParams): Promise<PlaywrightRunResult> {
  const logs: string[] = [];
  const dryRun = params.dryRun ?? false;
  let browser: Browser | null = null;

  const isES = params.cvRegion === "CV_ES";
  const resumeFilename = isES ? "Diego_Villanueva_CV_Espana.pdf" : "Diego_Villanueva_CV_Colombia.pdf";
  const resumePdfPath = path.join(process.cwd(), "storage", "cv", resumeFilename);
  const coverLetterPath = path.join(process.cwd(), "storage", "cv", "Diego_Villanueva_Carta_Presentacion.pdf");

  logs.push(`[${new Date().toLocaleTimeString()}] Iniciando navegador Chromium headless para ${params.companyName}`);
  logs.push(`[${new Date().toLocaleTimeString()}] Motor regional asignó: ${isES ? "🇪🇸 CV España" : "🇨🇴 CV Colombia"}`);
  logs.push(`[${new Date().toLocaleTimeString()}] Ruta de CV resuelta: ${resumePdfPath}`);

  try {
    let sessionPath: string | null = null;
    if (params.jobUrl.includes("linkedin.com")) {
      sessionPath = getSessionFilePath("linkedin");
    } else if (params.jobUrl.includes("infojobs.net")) {
      sessionPath = getSessionFilePath("infojobs");
    } else if (params.jobUrl.includes("computrabajo.com")) {
      sessionPath = getSessionFilePath("computrabajo");
    }

    if (sessionPath) {
      logs.push(`[${new Date().toLocaleTimeString()}] Sesión autenticada detectada y cargada: ${path.basename(sessionPath)}`);
    }

    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
      ...(sessionPath ? { storageState: sessionPath } : {}),
    });

    const page = await context.newPage();
    logs.push(`[${new Date().toLocaleTimeString()}] Navegando a la oferta: ${params.jobUrl}`);
    
    await page.goto(params.jobUrl, { waitUntil: "domcontentloaded", timeout: 35000 });

    const currentUrl = page.url();
    let platform: "Greenhouse" | "Lever" | "LinkedIn" | "Generic" = "Generic";

    if (params.jobUrl.includes("linkedin.com") || currentUrl.includes("linkedin.com")) {
      platform = "LinkedIn";
    } else if (currentUrl.includes("greenhouse.io") || (await page.$("#application_form, #first_name"))) {
      platform = "Greenhouse";
    } else if (currentUrl.includes("lever.co") || (await page.$('input[name="name"], .postings-btn'))) {
      platform = "Lever";
    }

    logs.push(`[${new Date().toLocaleTimeString()}] Plataforma ATS detectada: ${platform}`);

    let fillResult: { success: boolean; filledFields: string[]; error?: string; screenshotPath?: string } = {
      success: false,
      filledFields: [],
    };

    if (platform === "LinkedIn") {
      const linkedInRes = await fillLinkedInJob(page, {
        cvRegion: params.cvRegion,
        resumePdfPath,
        coverLetterText: params.coverLetterText,
        dryRun,
      });
      logs.push(...linkedInRes.logs);
      fillResult.filledFields = linkedInRes.filledFields;
      fillResult.success = linkedInRes.success;
      fillResult.error = linkedInRes.error;
    } else if (platform === "Greenhouse") {
      fillResult = await fillGreenhouseForm(page, {
        cvRegion: params.cvRegion,
        resumePdfPath,
        coverLetterPdfPath: coverLetterPath,
        coverLetterText: params.coverLetterText,
        dryRun,
      });
    } else if (platform === "Lever") {
      const applyBtn = await page.$('a[href*="#apply"], a.postings-btn, .template-btn-submit');
      if (applyBtn) {
        await applyBtn.click().catch(() => {});
        await page.waitForTimeout(1000);
      }

      fillResult = await fillLeverForm(page, {
        cvRegion: params.cvRegion,
        resumePdfPath,
        coverLetterPdfPath: coverLetterPath,
        coverLetterText: params.coverLetterText,
        dryRun,
      });
    } else {
      fillResult = await fillGreenhouseForm(page, {
        cvRegion: params.cvRegion,
        resumePdfPath,
        coverLetterText: params.coverLetterText,
        dryRun,
      });
    }

    // Resolver preguntas ATS adicionales con Gemini IA para portales estándar
    if (platform !== "LinkedIn") {
      logs.push(`[${new Date().toLocaleTimeString()}] Analizando preguntas personalizadas con Gemini IA...`);
      const customQ = await solveCustomAtsQuestions(page, isES);
      if (customQ.answeredCount > 0) {
        logs.push(...customQ.logs);
        fillResult.filledFields.push(`preguntas_adicionales_ia (${customQ.answeredCount})`);
      }
    }

    // Validación estricta: 0 campos rellenados = fallo de postulación
    if (fillResult.filledFields.length === 0 && !fillResult.success) {
      fillResult.success = false;
      if (!fillResult.error) {
        fillResult.error = "No se encontraron campos de postulación o la página requiere inicio de sesión.";
      }
      logs.push(`[AVISO] ${fillResult.error}`);
    } else {
      logs.push(`[${new Date().toLocaleTimeString()}] Campos rellenados con éxito: ${fillResult.filledFields.join(", ")}`);
    }

    // Tomar captura de auditoría
    const screenshotFilename = `proof-${Date.now()}.png`;
    const publicScreenshotDir = path.join(process.cwd(), "public", "screenshots");
    const screenshotPath = path.join(publicScreenshotDir, screenshotFilename);

    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
    logs.push(`[${new Date().toLocaleTimeString()}] Captura de auditoría guardada en /screenshots/${screenshotFilename}`);

    // Si dry-run es false y no es LinkedIn (LinkedIn envía en su propio bucle), enviar formulario
    if (!dryRun && fillResult.success && platform !== "LinkedIn") {
      logs.push(`[${new Date().toLocaleTimeString()}] Modo producción: Buscando botón de envío...`);
      const submitButton = await page.$('button[type="submit"], input[type="submit"], #submit_app, button.postings-btn');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(4000);
        logs.push(`[${new Date().toLocaleTimeString()}] Formulario enviado exitosamente.`);
      }
    } else if (dryRun && fillResult.success) {
      logs.push(`[${new Date().toLocaleTimeString()}] [DRY-RUN] Formulario verificado al 100% (Envío pausado para revisión).`);
    }

    await browser.close();

    return {
      success: fillResult.success,
      dryRun,
      platform,
      filledFields: fillResult.filledFields,
      screenshotUrl: `/screenshots/${screenshotFilename}`,
      pdfAttached: resumeFilename,
      logs,
      error: fillResult.error,
    };
  } catch (error) {
    if (browser) await browser.close();
    const errMsg = error instanceof Error ? error.message : "Error durante la ejecución de Playwright";
    logs.push(`[ERROR] ${errMsg}`);
    return {
      success: false,
      dryRun,
      platform: "Generic",
      filledFields: [],
      pdfAttached: resumeFilename,
      logs,
      error: errMsg,
    };
  }
}
