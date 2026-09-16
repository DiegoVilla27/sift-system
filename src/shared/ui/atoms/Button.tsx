import React, { forwardRef } from "react";
import { cn } from "@/shared/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#090d16] disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg cursor-pointer";

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 focus:ring-blue-500 shadow-md shadow-blue-600/20",
      secondary:
        "bg-slate-800 text-slate-100 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 focus:ring-slate-500",
      outline:
        "bg-transparent text-slate-200 border border-slate-700 hover:bg-slate-800/80 active:bg-slate-800 focus:ring-slate-500",
      ghost:
        "bg-transparent text-slate-300 hover:bg-slate-800/60 hover:text-white focus:ring-slate-500",
      danger:
        "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 active:bg-red-600/40 focus:ring-red-500",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus:ring-emerald-500 shadow-md shadow-emerald-600/20",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2 gap-2",
      lg: "text-base px-5 py-2.5 gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
