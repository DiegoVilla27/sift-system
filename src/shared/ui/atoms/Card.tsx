import React from "react";
import { cn } from "@/shared/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  hoverEffect = false,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-[#0d1527]/90 border border-slate-800/80 rounded-xl p-5 shadow-lg backdrop-blur-sm transition-all duration-200",
        hoverEffect && "hover:border-slate-700 hover:shadow-xl hover:shadow-blue-950/10 hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("flex items-center justify-between pb-3 border-b border-slate-800/60 mb-4", className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h3 className={cn("text-base font-semibold text-slate-100", className)} {...props}>
      {children}
    </h3>
  );
};
