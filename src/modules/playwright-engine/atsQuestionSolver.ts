import { Page } from "playwright";
import { getGeminiClient } from "@/modules/ai-pipeline/geminiClient";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";

export async function solveCustomAtsQuestions(
  page: Page,
  isES: boolean
): Promise<{ answeredCount: number; logs: string[] }> {
  const logs: string[] = [];
  let answeredCount = 0;

  try {
    // 1. Detectar campos de texto o textareas vacíos con etiquetas
    const textInputs = await page.$$("input[type='text']:visible, textarea:visible");
    const p = CANDIDATE_MASTER_PROFILE;

    for (const input of textInputs) {
      const isAlreadyFilled = await input.inputValue().catch(() => "");
      if (isAlreadyFilled && isAlreadyFilled.trim().length > 0) continue;

      const questionContext = await input.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        const placeholder = el.getAttribute("placeholder") || "";
        const name = el.getAttribute("name") || "";
        const ariaLabel = el.getAttribute("aria-label") || "";
        const parentText = el.closest(".form-group, .field, fieldset, tr, div")?.textContent || "";
        return {
          id: el.id,
          name,
          placeholder,
          label: (label?.textContent || ariaLabel || placeholder || name).trim(),
          contextSnippet: parentText.slice(0, 300).trim(),
        };
      });

      if (!questionContext.label || questionContext.label.length < 3) continue;

      // 1a. Detección determinista de Documento de Identidad (DNI/NIE España o Cédula Colombia)
      const normLabel = (
        questionContext.label + " " + questionContext.name + " " + questionContext.placeholder
      ).toLowerCase();

      const isDocIdField =
        normLabel.includes("dni") ||
        normLabel.includes("nie") ||
        normLabel.includes("nif") ||
        normLabel.includes("cédula") ||
        normLabel.includes("cedula") ||
        normLabel.includes("documento de identidad") ||
        normLabel.includes("número de documento") ||
        normLabel.includes("numero de documento") ||
        normLabel.includes("national id") ||
        normLabel.includes("identification number") ||
        normLabel.includes("nº documento");

      if (isDocIdField) {
        const docValue = isES ? p.spain.dni : p.colombia.cedula;
        await input.fill(docValue);
        answeredCount++;
        logs.push(`[Regla Legal Identidad] Llenó ${isES ? "DNI (España)" : "Cédula (Colombia)"}: "${docValue}"`);
        continue;
      }

      // Preguntar a Gemini
      try {
        const ai = getGeminiClient();
        const prompt = `
Eres Diego Villanueva (${p.title}, 8+ años de experiencia, React, Angular, Next.js, TypeScript).
- Residencia: ${isES ? p.spain.fullLocation : p.colombia.fullLocation}
- Documento de identidad: ${isES ? `DNI: ${p.spain.dni}` : `Cédula de Ciudadanía: ${p.colombia.cedula}`}
- Salario esperado: ${isES ? p.spain.salaryLabel : p.colombia.salaryUsdLabel}
- Disponibilidad: Inmediata para entrevistas e incorporación.
- Discapacidad: 77% legalmente acreditada en España (Ley LGD).
- Permiso de trabajo: Sí, con autorización y legalidad completa.

Responde de forma concisa y directa a la siguiente pregunta de un formulario de empleo:
PREGUNTA: "${questionContext.label}"
CONTEXTO DEL CAMPO: "${questionContext.contextSnippet}"

Instrucción: Devuelve ÚNICAMENTE el texto que debe escribirse en el campo, sin explicaciones ni comillas. Si es un número (ej. años de experiencia), escribe solo el número. Si pide documento de identidad, usa el proporcionado arriba.
`;

        const res = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });

        const answerText = (res.text || "").trim();
        if (answerText.length > 0) {
          await input.fill(answerText);
          answeredCount++;
          logs.push(`[IA Gemini] Respondió "${questionContext.label}": "${answerText}"`);
        }
      } catch (err) {
        // Fallback silencioso si falla la llamada
      }
    }

    // 2. Detectar preguntas de radio/checkbox de Discapacidad / Permiso de trabajo
    const radioInputs = await page.$$("input[type='radio']:visible");
    for (const radio of radioInputs) {
      const radioContext = await radio.evaluate((el) => {
        const parent = el.closest("fieldset, .field, div");
        const parentText = (parent?.textContent || "").toLowerCase();
        const label = document.querySelector(`label[for="${el.id}"]`)?.textContent?.toLowerCase() || "";
        return { parentText, label };
      });

      // Si la pregunta es sobre discapacidad en España y la opción es "Sí"
      if (
        isES &&
        (radioContext.parentText.includes("discapacidad") || radioContext.parentText.includes("disability")) &&
        (radioContext.label.includes("sí") || radioContext.label.includes("si") || radioContext.label.includes("yes"))
      ) {
        await radio.check().catch(() => {});
        answeredCount++;
        logs.push("[Regla Legal ES] Marcada opción Sí en cuota de discapacidad (77% LGD)");
      }

      // Si la pregunta es sobre permiso de trabajo y la opción es "Sí"
      if (
        (radioContext.parentText.includes("permiso de trabajo") ||
          radioContext.parentText.includes("autorizado para trabajar") ||
          radioContext.parentText.includes("authorized to work")) &&
        (radioContext.label.includes("sí") || radioContext.label.includes("si") || radioContext.label.includes("yes"))
      ) {
        await radio.check().catch(() => {});
        answeredCount++;
        logs.push("[Regla Legal] Marcada opción Sí en autorización de trabajo legal");
      }
    }

    // 3. Detectar selectores <select> para tipo de documento
    const selectElements = await page.$$("select:visible");
    for (const select of selectElements) {
      const selectContext = await select.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`)?.textContent || "";
        const name = el.getAttribute("name") || "";
        const options = Array.from(el.querySelectorAll("option")).map((o) => ({
          value: o.value,
          text: o.textContent?.trim() || "",
        }));
        return { label: (label + " " + name).toLowerCase(), options };
      });

      if (
        selectContext.label.includes("tipo de documento") ||
        selectContext.label.includes("tipo documento") ||
        selectContext.label.includes("document type") ||
        selectContext.label.includes("tipo de identificaci")
      ) {
        if (isES) {
          const dniOption = selectContext.options.find(
            (o) => o.text.toLowerCase().includes("dni") || o.text.toLowerCase().includes("nif")
          );
          if (dniOption) {
            await select.selectOption(dniOption.value).catch(() => {});
            answeredCount++;
            logs.push(`[Regla Legal ES] Seleccionado tipo de documento: "${dniOption.text}"`);
          }
        } else {
          const ccOption = selectContext.options.find(
            (o) =>
              o.text.toLowerCase().includes("cédula") ||
              o.text.toLowerCase().includes("cedula") ||
              o.text.toLowerCase().includes("cc")
          );
          if (ccOption) {
            await select.selectOption(ccOption.value).catch(() => {});
            answeredCount++;
            logs.push(`[Regla Legal CO] Seleccionado tipo de documento: "${ccOption.text}"`);
          }
        }
      }
    }

    return { answeredCount, logs };
  } catch (error) {
    return { answeredCount, logs };
  }
}
