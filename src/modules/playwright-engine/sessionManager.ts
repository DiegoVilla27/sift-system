import fs from "fs";
import path from "path";
import { chromium, Browser, BrowserContext } from "playwright";

export type PlatformId = "linkedin" | "infojobs" | "computrabajo";

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  loginUrl: string;
  homeUrlPatterns: string[];
  filename: string;
  description: string;
}

export const PLATFORMS_CONFIG: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    loginUrl: "https://www.linkedin.com/login",
    homeUrlPatterns: [
      "linkedin.com/feed",
      "linkedin.com/in/",
      "linkedin.com/jobs",
      "linkedin.com/mynetwork",
      "linkedin.com/messaging",
    ],
    filename: "linkedin_state.json",
    description: "Búsqueda completa y Solicitud Sencilla (Easy Apply) en España y Colombia.",
  },
  {
    id: "infojobs",
    name: "InfoJobs",
    loginUrl: "https://www.infojobs.net/candidate/candidate-login/candidate-login.xhtml",
    homeUrlPatterns: [
      "infojobs.net/candidate/candidate-home",
      "infojobs.net/candidate/profile",
      "infojobs.net/candidate/my-applications",
      "infojobs.net/candidate/",
    ],
    filename: "infojobs_state.json",
    description: "Portal #1 de empleo en España para ofertas locales con bonificación LGD.",
  },
  {
    id: "computrabajo",
    name: "CompuTrabajo",
    loginUrl: "https://candidato.computrabajo.com/login",
    homeUrlPatterns: [
      "candidato.computrabajo.com/candidato",
      "candidato.computrabajo.com/curriculum",
      "computrabajo.com.co/candidato",
      "computrabajo.com/candidato",
    ],
    filename: "computrabajo_state.json",
    description: "Portal líder en Colombia y LATAM para vacantes remotas o en Armenia/Eje Cafetero.",
  },
];

const SESSIONS_DIR = path.join(process.cwd(), "storage", "sessions");

function ensureSessionsDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  }
}

export interface SessionStatus {
  id: PlatformId;
  name: string;
  hasSession: boolean;
  lastUpdated?: string;
  cookieCount: number;
  description: string;
}

/**
 * Valida de forma estricta si las cookies representan una sesión realmente autenticada
 */
export function isPlatformAuthenticated(
  platformId: PlatformId,
  cookies: Array<{ name: string; value: string }>
): boolean {
  if (!Array.isArray(cookies) || cookies.length === 0) return false;

  if (platformId === "linkedin") {
    // La cookie li_at es el token de sesión indispensable de LinkedIn
    return cookies.some(
      (c) => c.name === "li_at" && typeof c.value === "string" && c.value.length > 15
    );
  }

  if (platformId === "infojobs") {
    // Cookie de candidato autenticado en InfoJobs
    return cookies.some((c) =>
      ["user_session", "tokenId", "ij_token", "SP_CANDIDATE", "token"].includes(c.name)
    );
  }

  if (platformId === "computrabajo") {
    // Cookie de candidato en CompuTrabajo
    return cookies.some((c) =>
      ["user_session", ".ASPXAUTH", "candidate_id", "candidato"].includes(c.name)
    );
  }

  return false;
}

/**
 * Obtiene el estado actual de las sesiones seguras en disco
 */
export function getSessionStatuses(): SessionStatus[] {
  ensureSessionsDir();

  return PLATFORMS_CONFIG.map((config) => {
    const filePath = path.join(SESSIONS_DIR, config.filename);
    let hasSession = false;
    let lastUpdated: string | undefined;
    let cookieCount = 0;

    if (fs.existsSync(filePath)) {
      try {
        const stats = fs.statSync(filePath);
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed.cookies)) {
          hasSession = isPlatformAuthenticated(config.id, parsed.cookies);
          if (hasSession) {
            cookieCount = parsed.cookies.length;
            lastUpdated = stats.mtime.toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            });
          }
        }
      } catch (err) {
        hasSession = false;
      }
    }

    return {
      id: config.id,
      name: config.name,
      hasSession,
      lastUpdated,
      cookieCount,
      description: config.description,
    };
  });
}

/**
 * Obtiene la ruta de archivo de sesión para un portal solo si está autenticado
 */
export function getSessionFilePath(platformId: PlatformId): string | null {
  ensureSessionsDir();
  const config = PLATFORMS_CONFIG.find((p) => p.id === platformId);
  if (!config) return null;

  const filePath = path.join(SESSIONS_DIR, config.filename);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.cookies) && isPlatformAuthenticated(platformId, parsed.cookies)) {
        return filePath;
      }
    } catch {}
  }
  return null;
}

/**
 * Elimina una sesión guardada
 */
export function deleteSession(platformId: PlatformId): boolean {
  ensureSessionsDir();
  const config = PLATFORMS_CONFIG.find((p) => p.id === platformId);
  if (!config) return false;

  const filePath = path.join(SESSIONS_DIR, config.filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Lanza una ventana interactiva no-headless en el escritorio de Diego para login 1-clic seguro.
 * Solo guarda la sesión cuando se verifique la autenticación real del usuario.
 */
export async function launchInteractiveLogin(
  platformId: PlatformId
): Promise<{ success: boolean; message: string }> {
  ensureSessionsDir();
  const config = PLATFORMS_CONFIG.find((p) => p.id === platformId);
  if (!config) {
    return { success: false, message: `Plataforma ${platformId} no reconocida.` };
  }

  const sessionPath = path.join(SESSIONS_DIR, config.filename);
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: false,
      args: ["--start-maximized"],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
    });
    const page = await context.newPage();

    await page.goto(config.loginUrl, { waitUntil: "domcontentloaded" });

    // Polling inteligente: espera a que el usuario complete login real (hasta 5 minutos)
    const startTime = Date.now();
    const timeoutMs = 5 * 60 * 1000;
    let loginDetected = false;

    while (Date.now() - startTime < timeoutMs) {
      if (page.isClosed() || !browser.isConnected()) {
        break;
      }

      const currentUrl = page.url();
      const cookies = await context.cookies();

      // Validación estricta por plataforma
      if (platformId === "linkedin") {
        const hasLiAt = cookies.some(
          (c) => c.name === "li_at" && typeof c.value === "string" && c.value.length > 15
        );
        const isOnFeedOrJobs =
          currentUrl.includes("/feed") ||
          currentUrl.includes("/in/") ||
          currentUrl.includes("/jobs");

        if (hasLiAt || isOnFeedOrJobs) {
          // Esperar 3 segundos para asentar tokens
          await page.waitForTimeout(3000);
          await context.storageState({ path: sessionPath });
          loginDetected = true;
          break;
        }
      } else if (platformId === "infojobs") {
        const isCandidateHome =
          currentUrl.includes("/candidate-home") ||
          currentUrl.includes("/profile") ||
          currentUrl.includes("/my-applications");
        const hasUserSession = cookies.some((c) =>
          ["user_session", "tokenId", "ij_token"].includes(c.name)
        );

        if (isCandidateHome || hasUserSession) {
          await page.waitForTimeout(3000);
          await context.storageState({ path: sessionPath });
          loginDetected = true;
          break;
        }
      } else if (platformId === "computrabajo") {
        const isCandidato =
          (currentUrl.includes("/candidato") || currentUrl.includes("/curriculum")) &&
          !currentUrl.includes("/login");

        if (isCandidato) {
          await page.waitForTimeout(3000);
          await context.storageState({ path: sessionPath });
          loginDetected = true;
          break;
        }
      }

      await page.waitForTimeout(2000);
    }

    if (browser.isConnected()) {
      if (loginDetected) {
        await page.waitForTimeout(1000);
      }
      await browser.close();
    }

    // Verificar si el archivo quedó persistido y contiene sesión válida
    if (fs.existsSync(sessionPath)) {
      const content = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
      if (isPlatformAuthenticated(platformId, content.cookies)) {
        return {
          success: true,
          message: `¡Sesión de ${config.name} verificada y guardada con éxito! Ya puedes postularte a sus vacantes.`,
        };
      } else {
        // Eliminar archivo inválido si no tiene credenciales reales
        fs.unlinkSync(sessionPath);
      }
    }

    return {
      success: false,
      message: loginDetected
        ? `Sesión detectada pero no se pudieron persistir cookies de autenticación.`
        : `Ventana cerrada antes de completar el inicio de sesión. Inicia sesión con tus datos en la ventana abierta.`,
    };
  } catch (error) {
    if (browser && browser.isConnected()) {
      await browser.close().catch(() => {});
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error inesperado al iniciar sesión.",
    };
  }
}
