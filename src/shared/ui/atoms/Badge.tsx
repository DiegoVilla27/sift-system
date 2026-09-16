import React from "react";
import { cn } from "@/shared/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "accent" | "purple";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}) => {
  const variants = {
    default: "bg-slate-800/80 text-slate-300 border border-slate-700/50",
    success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/10 text-red-400 border border-red-500/30",
    info: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    accent: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    outline: "bg-transparent text-slate-400 border border-slate-700",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 rounded",
    md: "text-xs px-2.5 py-1 rounded-md",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium whitespace-nowrap transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
