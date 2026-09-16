import { getStoredApplications } from "@/modules/storage/jsonStorage";
import { ApplicationRecord } from "@/shared/types";

const COOLDOWN_DAYS = 45;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/\b(s\.?l\.?|s\.?a\.?|inc\.?|llc|corp|colombia|espana|spain|group|tech|technologies)\b/gi, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export interface CooldownCheckResult {
  canApply: boolean;
  reason?: string;
  daysRemaining?: number;
  existingApplication?: ApplicationRecord;
}

export function checkApplicationCooldown(
  company: string,
  jobTitle: string,
  sourceUrl?: string
): CooldownCheckResult {
  const applications = getStoredApplications();
  const now = new Date().getTime();

  const normCompany = normalize(company);
  const normTitle = normalize(jobTitle);

  for (const app of applications) {
    const appDate = new Date(app.appliedAt).getTime();
    const diffDays = Math.floor((now - appDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= COOLDOWN_DAYS) {
      // 1. Coincidencia exacta de URL
      const urlMatches = sourceUrl && app.portalUrl && app.portalUrl.split("?")[0] === sourceUrl.split("?")[0];

      // 2. Coincidencia de Empresa y Rol normalizados
      const companyMatches = normalize(app.company).includes(normCompany) || normCompany.includes(normalize(app.company));
      const titleMatches = normalize(app.jobTitle).includes(normTitle) || normTitle.includes(normalize(app.jobTitle));

      if (urlMatches || (companyMatches && titleMatches)) {
        const daysRemaining = COOLDOWN_DAYS - diffDays;
        return {
          canApply: false,
          daysRemaining,
          reason: `Ya te has postulado a ${app.company} hace ${diffDays} días (${app.jobTitle}). Cooldown activo de seguridad (${daysRemaining} días restantes).`,
          existingApplication: app,
        };
      }
    }
  }

  return { canApply: true };
}
