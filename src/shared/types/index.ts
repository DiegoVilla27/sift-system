/** Modalidad de trabajo de la vacante */
export type JobModality = "REMOTE" | "HYBRID" | "ONSITE";

/** Plataformas de búsqueda soportadas */
export type SourcePlatform =
  | "LinkedIn"
  | "InfoJobs"
  | "CompuTrabajo"
  | "GetOnBoard"
  | "Tecnoempleo"
  | "Greenhouse"
  | "Lever"
  | "RemoteOK"
  | "Remotive"
  | "PeakU"
  | "Torre"
  | "Manfred"
  | "Bumeran"
  | "Empleate"
  | "Jobatus"
  | "Talent"
  | "Google"
  | "Domestika"
  | "Jooble"
  | "WeWorkRemotely"
  | "Other";

/** Vacante de empleo encontrada en los portales */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string;
  modality: JobModality;
  stack: string[];
  description: string;
  postedAt: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  matchScore: number;
  salaryRange?: string;

  /** Estado de gestión */
  isApplied: boolean;
  appliedAt?: string;
  isDismissed?: boolean;
  dismissedAt?: string;
}

/** Registro de vacante descartada (persistido para ignorar en futuras búsquedas) */
export interface DismissedJobRecord {
  id: string;
  jobId: string;
  company: string;
  jobTitle: string;
  portalUrl?: string;
  dismissedAt: string;
}

/** Etapa de seguimiento de una postulación */
export type ApplicationStage =
  | "POSTULADA"
  | "EN_PROCESO"
  | "ENTREVISTA"
  | "OFERTA"
  | "RECHAZADA";

/** Nota de seguimiento dentro de una postulación */
export interface TrackingNote {
  id: string;
  createdAt: string;
  text: string;
}

/** Registro de postulación gestionada por el usuario */
export interface PostulacionRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  modality: JobModality;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  appliedAt: string;
  stage: ApplicationStage;
  salaryRange?: string;
  trackingNotes: TrackingNote[];
}

/** Configuración de plataforma o empresa de búsqueda */
export interface PortalConfig {
  id: string;
  name: string;
  category: "portal" | "company_ats";
  enabled: boolean;
  url?: string;
  regionHint?: "SPAIN" | "LATAM" | "GLOBAL";
  ats?: "greenhouse" | "lever";
  slug?: string;
  isCustom?: boolean;
}

/** Perfil del usuario/candidato que realiza las búsquedas */
export interface CandidateProfile {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  roleTitle: string;
  yearsOfExperience?: number;
  technologies: string[];
  minMatchScore?: number;
  cvFileName?: string;
  cvText?: string;
  lastUpdated: string;
}


