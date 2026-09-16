import { Page } from "playwright";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";

export interface FillOptions {
  cvRegion: "CV_ES" | "CV_CO";
  resumePdfPath: string;
  coverLetterPdfPath?: string;
  coverLetterText?: string;
  dryRun?: boolean; // If true, do not click submit button
}

export async function fillGreenhouseForm(page: Page, options: FillOptions): Promise<{
  success: boolean;
  filledFields: string[];
  screenshotPath?: string;
  error?: string;
}> {
  const p = CANDIDATE_MASTER_PROFILE;
  const isES = options.cvRegion === "CV_ES";
  const phone = isES ? p.spain.formattedPhone : p.colombia.formattedPhone;
  const filledFields: string[] = [];

  try {
    // 1. Nombre y Apellidos
    if (await page.$("#first_name")) {
      await page.fill("#first_name", "Diego Fernando");
      filledFields.push("first_name");
    }
    if (await page.$("#last_name")) {
      await page.fill("#last_name", "Villanueva Penagos");
      filledFields.push("last_name");
    }

    // 2. Email
    if (await page.$("#email")) {
      await page.fill("#email", p.email);
      filledFields.push("email");
    }

    // 3. Teléfono
    if (await page.$("#phone")) {
      await page.fill("#phone", phone);
      filledFields.push(`phone (${phone})`);
    }

    // 4. Subida del archivo PDF del CV
    const resumeInput = await page.$('input[type="file"][id*="resume"], input[type="file"]');
    if (resumeInput && options.resumePdfPath) {
      await resumeInput.setInputFiles(options.resumePdfPath);
      filledFields.push(`resume_file (${options.resumePdfPath})`);
    }

    // 5. Carta de presentación (archivo o texto)
    const coverLetterFile = await page.$('input[type="file"][id*="cover_letter"]');
    if (coverLetterFile && options.coverLetterPdfPath) {
      await coverLetterFile.setInputFiles(options.coverLetterPdfPath);
      filledFields.push("cover_letter_file");
    }

    const coverLetterTextarea = await page.$('textarea[id*="cover_letter"], textarea[name*="cover_letter"]');
    if (coverLetterTextarea && options.coverLetterText) {
      await coverLetterTextarea.fill(options.coverLetterText);
      filledFields.push("cover_letter_text");
    }

    // 6. Campos sociales y enlaces (LinkedIn, GitHub, Portfolio)
    const inputs = await page.$$("input[type='text'], input:not([type])");
    for (const input of inputs) {
      const labelText = (await input.evaluate((el) => {
        const label = document.querySelector(`label[for="${el.id}"]`);
        return (label?.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "").toLowerCase();
      })) || "";

      if (labelText.includes("linkedin")) {
        await input.fill(p.linkedInUrl);
        filledFields.push("linkedin");
      } else if (labelText.includes("github")) {
        await input.fill(p.gitHubUrl);
        filledFields.push("github");
      } else if (labelText.includes("website") || labelText.includes("portfolio")) {
        await input.fill(p.portfolioUrl);
        filledFields.push("portfolio");
      }
    }

    return {
      success: true,
      filledFields,
    };
  } catch (error) {
    return {
      success: false,
      filledFields,
      error: error instanceof Error ? error.message : "Error rellenando Greenhouse",
    };
  }
}
