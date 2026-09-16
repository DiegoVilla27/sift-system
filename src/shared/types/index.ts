export type JobModality = "REMOTE" | "HYBRID" | "ONSITE";

export type TargetRegion = "SPAIN" | "LATAM" | "UNKNOWN";

export type CVId = "CV_ES" | "CV_CO";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  city?: string;
  country: string;
  modality: JobModality;
  region: TargetRegion;
  salaryRange?: {
    min: number;
    max: number;
    currency: "EUR" | "USD" | "COP";
  };
  stack: string[];
  requiredYears?: number;
  description: string;
  postedAt: string;
  sourceUrl: string;
  sourcePlatform: "Greenhouse" | "Lever" | "RemoteOK" | "Remotive" | "InfoJobs" | "LinkedIn" | "GetOnBoard" | "Tecnoempleo" | "Other";
  
  // AI Enrichment
  matchScore: number; // 0 - 100
  matchReasons: string[];
  missingSkills?: string[];
  keyPros: string[];
  keyCons?: string[];
  generatedCoverLetter: string;
  
  // Strict CV Routing
  assignedCvId: CVId;
  cvAssignmentReason: string;
  cvAssignmentConfidence: number; // 0 - 1
  
  // Application Status
  isApplied: boolean;
  appliedAt?: string;
  applicationStatus?: "QUEUED" | "IN_PROGRESS" | "SUCCESS" | "FAILED";
  alreadyApplied?: boolean;
  cooldownDaysRemaining?: number;

  // Dismissal Status
  isDismissed?: boolean;
  dismissedAt?: string;
  dismissReason?: string;
}

export interface DismissedJobRecord {
  id: string;
  jobId: string;
  company: string;
  jobTitle: string;
  portalUrl?: string;
  dismissedAt: string;
  reason?: string;
}

export type ApplicationStage = "APPLIED" | "IN_REVIEW" | "INTERVIEW" | "REJECTED" | "OFFER";

export interface CVProfile {
  id: CVId;
  code: "ES" | "CO";
  name: string;
  flag: string;
  tagline: string;
  candidateName: string;
  email: string;
  phone: string;
  locationLabel: string;
  legalStatus: string;
  pdfFilename: string;
  pdfSizeBytes: number;
  lastUpdated: string;
  headline: string;
  summary: string;
  coreStack: string[];
  targetRegions: string[];
  targetCountries: string[];
  matchKeywords: string[];
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  modality: JobModality;
  cvUsed: CVId;
  cvLabel: string;
  appliedAt: string;
  status: "SUCCESS" | "FAILED" | "QUEUED";
  stage?: ApplicationStage;
  notes?: string;
  matchScore: number;
  salary?: string;
  sourcePlatform: string;
  portalUrl: string;
  logs: {
    timestamp: string;
    level: "INFO" | "SUCCESS" | "WARN" | "ERROR";
    message: string;
  }[];
}

export interface DiscordNotificationConfig {
  webhookUrl: string;
  isEnabled: boolean;
  minScoreThreshold: number; // e.g. 85
  notifyOnAutoApply: boolean;
  notifyOnAmbiguity: boolean;
}
