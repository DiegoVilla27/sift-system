import React from "react";
import { CVId } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface RegionSelectorProps {
  selectedCvId?: CVId;
  onSelect?: (cvId: CVId) => void;
  readOnly?: boolean;
  className?: string;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  selectedCvId,
  onSelect,
  readOnly = false,
  className,
}) => {
  const options = [
    {
      id: "CV_ES" as CVId,
      flag: "🇪🇸",
      label: "CV España",
      sublabel: "España & Unión Europea",
      badge: "DNI/NIE",
    },
    {
      id: "CV_CO" as CVId,
      flag: "🇨🇴",
      label: "CV Colombia",
      sublabel: "LATAM & Remoto Andino",
      badge: "Cédula",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 gap-2.5", className)}>
      {options.map((opt) => {
        const isSelected = selectedCvId === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={readOnly}
            onClick={() => onSelect?.(opt.id)}
            className={cn(
              "flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200",
              isSelected
                ? "bg-blue-600/10 border-blue-500/50 text-white shadow-sm shadow-blue-500/10"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700",
              readOnly && "cursor-default"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl select-none">{opt.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-100">{opt.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{opt.sublabel}</p>
              </div>
            </div>
            {isSelected && (
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};
