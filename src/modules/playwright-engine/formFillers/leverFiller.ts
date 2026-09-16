import { Page } from "playwright";
import { CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/candidateMasterProfile";
import { FillOptions } from "./greenhouseFiller";

export async function fillLeverForm(page: Page, options: FillOptions): Promise<{
  success: boolean;
  filledFields: string[];
  error?: string;
}> {
  const p = CANDIDATE_MASTER_PROFILE;
  const isES = options.cvRegion === "CV_ES";
  const phone = isES ? p.spain.formattedPhone : p.colombia.formattedPhone;
  const filledFields: string[] = [];

  try {
    // 1. Nombre Completo
    if (await page.$('input[name="name"]')) {
      await page.fill('input[name="name"]', p.fullName);
      filledFields.push("name");
    }

    // 2. Email
    if (await page.$('input[name="email"]')) {
      await page.fill('input[name="email"]', p.email);
      filledFields.push("email");
    }

    // 3. Teléfono
    if (await page.$('input[name="phone"]')) {
      await page.fill('input[name="phone"]', phone);
      filledFields.push(`phone (${phone})`);
    }

    // 4. Subida del CV en PDF
    const resumeInput = await page.$('input[type="file"][name="resume"], input[type="file"]');
    if (resumeInput && options.resumePdfPath) {
      await resumeInput.setInputFiles(options.resumePdfPath);
      filledFields.push(`resume_file (${options.resumePdfPath})`);
    }

    // 5. Enlaces (LinkedIn, GitHub, Portfolio)
    if (await page.$('input[name*="LinkedIn"], input[name*="linkedin"]')) {
      await page.fill('input[name*="LinkedIn"], input[name*="linkedin"]', p.linkedInUrl);
      filledFields.push("linkedin");
    }

    if (await page.$('input[name*="GitHub"], input[name*="github"]')) {
      await page.fill('input[name*="GitHub"], input[name*="github"]', p.gitHubUrl);
      filledFields.push("github");
    }

    if (await page.$('input[name*="Portfolio"], input[name*="portfolio"], input[name*="website"]')) {
      await page.fill('input[name*="Portfolio"], input[name*="portfolio"], input[name*="website"]', p.portfolioUrl);
      filledFields.push("portfolio");
    }

    // 6. Comentarios adicionales / Cover letter
    if (await page.$('textarea[name="comments"]') && options.coverLetterText) {
      await page.fill('textarea[name="comments"]', options.coverLetterText);
      filledFields.push("cover_letter_comments");
    }

    return {
      success: true,
      filledFields,
    };
  } catch (error) {
    return {
      success: false,
      filledFields,
      error: error instanceof Error ? error.message : "Error rellenando Lever",
    };
  }
}
