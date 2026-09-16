import React from "react";
import { Card } from "@/shared/ui/atoms/Card";
import { cn } from "@/shared/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "blue" | "emerald" | "amber" | "purple";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = "blue",
  className,
}) => {
  const accentColors = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  return (
    <Card className={cn("p-4 flex items-center justify-between", className)}>
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <span className="text-2xl font-bold text-slate-100 mt-1">{value}</span>
        {subtitle && <span className="text-xs text-slate-400 mt-0.5">{subtitle}</span>}
      </div>
      <div className={cn("p-3 rounded-xl border", accentColors[variant])}>
        {icon}
      </div>
    </Card>
  );
};
