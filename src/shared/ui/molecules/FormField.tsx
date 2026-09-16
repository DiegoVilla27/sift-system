import React from "react";
import { cn } from "@/shared/lib/utils";

export interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  description,
  error,
  required,
  className,
  children,
}) => {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      </div>
      {description && <p className="text-xs text-slate-400 -mt-0.5">{description}</p>}
      <div className="mt-0.5">{children}</div>
      {error && <span className="text-xs text-red-400 font-medium">{error}</span>}
    </div>
  );
};
