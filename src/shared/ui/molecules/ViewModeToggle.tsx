"use client";

import React from "react";
import { LayoutGrid, Table, Columns3 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

export type ViewMode = "grid" | "table" | "kanban";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  showKanban?: boolean;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  showKanban,
  className,
}) => {
  return (
    <div
      className={cn(
        "inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
          mode === "grid"
            ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
        )}
        title="Vista en Cuadrícula (Cards)"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Cuadrícula</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("table")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
          mode === "table"
            ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
        )}
        title="Vista en Tabla"
      >
        <Table className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tabla</span>
      </button>

      {showKanban && (
        <button
          type="button"
          onClick={() => onChange("kanban")}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all",
            mode === "kanban"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
          )}
          title="Vista Tablero Kanban"
        >
          <Columns3 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Kanban</span>
        </button>
      )}
    </div>
  );
};
