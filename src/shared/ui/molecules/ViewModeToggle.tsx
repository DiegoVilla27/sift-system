"use client";

import React from "react";
import { LayoutGrid, Table2 } from "lucide-react";

export type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  const options = [
    { value: "grid" as ViewMode, icon: LayoutGrid, label: "Cuadrícula" },
    { value: "table" as ViewMode, icon: Table2, label: "Tabla" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          title={label}
          className={`p-1.5 rounded-md transition-all ${
            mode === value
              ? "bg-blue-600/20 text-blue-400 shadow-sm"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
