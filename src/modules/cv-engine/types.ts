import { CVProfile, CVId, TargetRegion } from "@/shared/types";

export interface DispatchResult {
  assignedCvId: CVId;
  targetRegion: TargetRegion;
  confidence: number; // 0.0 to 1.0
  reason: string;
  matchedRules: string[];
  isQuarantined: boolean;
}
