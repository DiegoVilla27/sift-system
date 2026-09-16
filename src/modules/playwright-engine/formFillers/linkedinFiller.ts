import { Page } from "playwright";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";
import { solveCustomAtsQuestions } from "../atsQuestionSolver";

export interface LinkedInFillOptions {
  cvRegion: "CV_ES" | "CV_CO";
  resumePdfPath: string;
  coverLetterText?: string;
  dryRun?: boolean;
}

export async function fillLinkedInJob(
  page: Page,
  options: LinkedInFillOptions
): Promise<{
  success: boolean;
  filledFields: string[];
  isEasyApply: boolean;
  externalUrl?: string;
  logs: string[];
  error?: string;
}> {
  const logs: string[] = [];
  const filledFields: string[] = [];
  const p = CANDIDATE_MASTER_PROFILE;
  const isES = options.cvRegion === "CV_ES";
  const phone = isES ? p.spain.formattedPhone : p.colombia.formattedPhone;
  const dryRun = options.dryRun ?? false;

  try {
    // 1. Aceptar banner de cookies si aparece
    try {
      const cookieBtn = await page.$(
        'button[action-type="ACCEPT"], #onetrust-accept-btn-handler, button:has-text("Aceptar"), button:has-text("Accept")'
      );
      if (cookieBtn) {
        await cookieBtn.click();
        await page.waitForTimeout(1000);
        logs.push("[LinkedIn] Banner de cookies aceptado.");
      }
    } catch {}

    // 2. Cerrar modales de inicio de sesión no deseados (si es vista pública)
    try {
      const dismissBtn = await page.$(
        '.modal__dismiss, button[aria-label="Dismiss"], button[aria-label="Cerrar"], .contextual-sign-in-modal__modal-dismiss-btn'
      );
      if (dismissBtn) {
        await dismissBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {}

    // 3. Comprobar si el usuario tiene sesión activa en LinkedIn
    const cookies = await page.context().cookies();
    const hasLiAt = cookies.some((c) => c.name === "li_at" && c.value && c.value.length > 10);

    if (!hasLiAt) {
      const errMsg =
        "Sesión de LinkedIn no iniciada. Para postularte automáticamente a ofertas de LinkedIn, ve a Ajustes ➔ 'Sesiones Seguras de Portales' e inicia sesión una sola vez.";
      logs.push(`[AVISO] ${errMsg}`);
      return {
        success: false,
        filledFields: [],
        isEasyApply: false,
        logs,
        error: errMsg,
      };
    }

    // 4. Buscar botón de Solicitud Sencilla (Easy Apply)
    const easyApplySelectors = [
      'button.jobs-apply-button',
      'button[aria-label*="Solicitud sencilla"]',
      'button[aria-label*="Easy Apply"]',
      '.jobs-s-apply button',
      'button:has-text("Solicitud sencilla")',
      'button:has-text("Easy Apply")',
    ];

    let easyApplyBtn = null;
    for (const sel of easyApplySelectors) {
      easyApplyBtn = await page.$(sel);
      if (easyApplyBtn) break;
    }

    // Si no hay botón de Solicitud Sencilla, verificar si es solicitud externa
    if (!easyApplyBtn) {
      const externalBtn = await page.$(
        'button:has-text("Solicitar"), a[href*="apply"], a.jobs-apply-button'
      );

      if (externalBtn) {
        const href = await externalBtn.getAttribute("href");
        logs.push(
          `[LinkedIn] Esta vacante no tiene 'Solicitud Sencilla'. Es de postulación externa hacia el sitio de la empresa.`
        );
        return {
          success: false,
          filledFields: [],
          isEasyApply: false,
          externalUrl: href || undefined,
          logs,
          error: "Oferta con postulación externa en la web de la empresa (no Easy Apply)",
        };
      }

      const errMsg = "No se encontró botón de 'Solicitud sencilla' ni enlace de postulación.";
      logs.push(`[LinkedIn] ${errMsg}`);
      return {
        success: false,
        filledFields: [],
        isEasyApply: false,
        logs,
        error: errMsg,
      };
    }

    logs.push("[LinkedIn] Botón 'Solicitud sencilla' encontrado. Abriendo formulario modal...");
    await easyApplyBtn.click();
    await page.waitForTimeout(2000);

    // 5. Esperar al modal de Easy Apply
    const modal = await page.$(
      '.jobs-easy-apply-modal, .artdeco-modal, div[role="dialog"]'
    );
    if (!modal) {
      const errMsg = "No se pudo abrir el modal de Solicitud Sencilla.";
      logs.push(`[ERROR] ${errMsg}`);
      return { success: false, filledFields: [], isEasyApply: true, logs, error: errMsg };
    }

    // 6. Recorrer los pasos del asistente de Solicitud Sencilla (máximo 8 pasos)
    let step = 1;
    let submitted = false;

    while (step <= 8 && !submitted) {
      logs.push(`[LinkedIn Easy Apply] Procesando paso ${step}...`);

      // 6a. Rellenar teléfono si está vacío
      const phoneInput = await page.$(
        'input[id*="phoneNumber"], input[type="tel"], input[name*="phone"]'
      );
      if (phoneInput) {
        const val = await phoneInput.inputValue().catch(() => "");
        if (!val || val.trim().length === 0) {
          await phoneInput.fill(phone);
          filledFields.push(`phone (${phone})`);
          logs.push(`[LinkedIn] Teléfono asignado: ${phone}`);
        }
      }

      // 6b. Subir CV si pide archivo
      const fileInput = await page.$('input[type="file"]');
      if (fileInput && options.resumePdfPath) {
        try {
          await fileInput.setInputFiles(options.resumePdfPath);
          filledFields.push(`resume (${options.resumePdfPath})`);
          logs.push(`[LinkedIn] CV adjuntado: ${options.resumePdfPath}`);
        } catch {}
      }

      // 6c. Resolver preguntas ATS personalizadas con Gemini y reglas deterministas
      const customQ = await solveCustomAtsQuestions(page, isES);
      if (customQ.answeredCount > 0) {
        logs.push(...customQ.logs);
        filledFields.push(`preguntas_ia (${customQ.answeredCount})`);
      }

      // 6d. Comprobar botón de "Enviar solicitud" (Paso final)
      const submitBtn = await page.$(
        'button[aria-label*="Enviar solicitud"], button:has-text("Enviar solicitud"), button[aria-label*="Submit application"], button:has-text("Submit application")'
      );

      if (submitBtn) {
        if (!dryRun) {
          logs.push("[LinkedIn] Presionando 'Enviar solicitud'...");
          await submitBtn.click();
          await page.waitForTimeout(3000);
          logs.push("🚀 ¡Postulación enviada exitosamente en LinkedIn!");
          submitted = true;
          filledFields.push("enviar_solicitud_ok");
        } else {
          logs.push("[DRY-RUN] Llegó al botón final 'Enviar solicitud'. Pausado para verificación.");
          submitted = true;
        }
        break;
      }

      // 6e. Comprobar botón "Revisar"
      const reviewBtn = await page.$(
        'button[aria-label*="Revisar"], button:has-text("Revisar"), button:has-text("Review")'
      );
      if (reviewBtn) {
        await reviewBtn.click();
        await page.waitForTimeout(1500);
        step++;
        continue;
      }

      // 6f. Comprobar botón "Siguiente"
      const nextBtn = await page.$(
        'button[aria-label*="Siguiente"], button:has-text("Siguiente"), button[aria-label*="Continuar"], button:has-text("Next")'
      );
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        step++;
        continue;
      }

      // Si no hay Siguiente, Revisar ni Enviar, romper
      break;
    }

    return {
      success: submitted && filledFields.length > 0,
      filledFields,
      isEasyApply: true,
      logs,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Error durante Solicitud Sencilla de LinkedIn";
    logs.push(`[ERROR] ${errMsg}`);
    return {
      success: false,
      filledFields,
      isEasyApply: false,
      logs,
      error: errMsg,
    };
  }
}
