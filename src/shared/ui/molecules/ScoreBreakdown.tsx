import React from "react";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import { Badge } from "@/shared/ui/atoms/Badge";
import { JobModality, CVId } from "@/shared/types";
import { Globe, Building2, MapPin } from "lucide-react";

export interface ScoreBreakdownProps {
  score: number;
  modality: JobModality;
  location: string;
  assignedCvId: CVId;
  stack: string[];
  className?: string;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  score,
  modality,
  location,
  assignedCvId,
  stack,
  className,
}) => {
  const cvLabel = assignedCvId === "CV_ES" ? "🇪🇸 CV España" : "🇨🇴 CV Colombia";
  
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ""}`}>
      <MatchScorePill score={score} size="sm" />
      
      <Badge variant={modality === "REMOTE" ? "success" : "info"} size="sm">
        {modality === "REMOTE" ? (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" /> 100% Remoto
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Híbrido
          </span>
        )}
      </Badge>

      <Badge variant="accent" size="sm">
        {cvLabel}
      </Badge>

      <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
        <MapPin className="w-3 h-3" /> {location}
      </span>
    </div>
  );
};
