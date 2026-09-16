import { ApplicationRecord } from "@/shared/types";

export interface AutoApplyConfig {
  autoApplyThreshold: number; // e.g. 85%
  enableRemote: boolean;
  enableHybrid: boolean;
  maxApplicationsPerDay: number;
}
