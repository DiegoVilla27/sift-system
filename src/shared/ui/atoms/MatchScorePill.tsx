import React from "react";
import { cn } from "@/shared/lib/utils";
import { Sparkles, Flame, CheckCircle2, AlertCircle } from "lucide-react";

export interface MatchScorePillProps {
  score: number; // 0 to 100
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const MatchScorePill: React.FC<MatchScorePillProps> = ({
  score,
  showIcon = true,
  size = "md",
  className,
}) => {
  const isHighMatch = score >= 70;
  const isMediumMatch = score >= 50 && score < 70;

  const colorStyles = isHighMatch
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10"
    : isMediumMatch
    ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
    : "bg-slate-800/80 text-slate-400 border-slate-700/50";

  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm font-semibold px-2.5 py-1 gap-1.5",
    lg: "text-base font-bold px-3.5 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border transition-all duration-300",
        colorStyles,
        sizeStyles[size],
        className
      )}
    >
      {showIcon && (
        <>
          {isHighMatch ? (
            <Flame className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ) : isMediumMatch ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          )}
        </>
      )}
      <span>{score}% Match</span>
    </span>
  );
};
