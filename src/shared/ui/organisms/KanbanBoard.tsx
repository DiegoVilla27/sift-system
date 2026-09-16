"use client";

import React, { useState } from "react";
import { ApplicationRecord, ApplicationStage } from "@/shared/types";
import { Card } from "@/shared/ui/atoms/Card";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Calendar,
  Building2,
  DollarSign,
  FileText,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
} from "lucide-react";

interface KanbanBoardProps {
  applications: ApplicationRecord[];
  onUpdateStage: (appId: string, newStage: ApplicationStage, notes?: string) => Promise<void>;
  onViewLogs: (app: ApplicationRecord) => void;
}

interface ColumnConfig {
  stage: ApplicationStage;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  badgeVariant: "warning" | "info" | "purple" | "danger" | "success";
}

const COLUMNS: ColumnConfig[] = [
  {
    stage: "APPLIED",
    title: "Postulada (Auto)",
    icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    colorClass: "border-amber-500/30 bg-amber-950/10",
    badgeVariant: "warning",
  },
  {
    stage: "IN_REVIEW",
    title: "En Revisión",
    icon: <UserCheck className="w-3.5 h-3.5 text-blue-400" />,
    colorClass: "border-blue-500/30 bg-blue-950/10",
    badgeVariant: "info",
  },
  {
    stage: "INTERVIEW",
    title: "Entrevista",
    icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
    colorClass: "border-purple-500/30 bg-purple-950/10",
    badgeVariant: "purple",
  },
  {
    stage: "REJECTED",
    title: "Descartada",
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
    colorClass: "border-rose-500/30 bg-rose-950/10",
    badgeVariant: "danger",
  },
  {
    stage: "OFFER",
    title: "Oferta Recibida",
    icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
    colorClass: "border-emerald-500/30 bg-emerald-950/10",
    badgeVariant: "success",
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onUpdateStage,
  onViewLogs,
}) => {
  const [editingNoteAppId, setEditingNoteAppId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleStartEditNote = (app: ApplicationRecord) => {
    setEditingNoteAppId(app.id);
    setNoteText(app.notes || "");
  };

  const handleSaveNote = async (app: ApplicationRecord) => {
    await onUpdateStage(app.id, app.stage || "APPLIED", noteText);
    setEditingNoteAppId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const columnApps = applications.filter(
          (a) => (a.stage || "APPLIED") === col.stage
        );

        return (
          <div
            key={col.stage}
            className={`rounded-xl border ${col.colorClass} p-3.5 flex flex-col min-h-[500px] shadow-sm`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-100">
                {col.icon}
                <span>{col.title}</span>
              </div>
              <Badge variant={col.badgeVariant} size="sm">
                {columnApps.length}
              </Badge>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {columnApps.length === 0 ? (
                <div className="text-center py-8 text-[11px] text-slate-400 italic">
                  Sin candidaturas aquí
                </div>
              ) : (
                columnApps.map((app) => (
                  <Card
                    key={app.id}
                    className="p-3.5 border-slate-800 bg-[#0d1527] hover:border-slate-700 transition-all text-xs space-y-2.5 shadow-md"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-white line-clamp-1">
                        {app.company}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {app.matchScore}%
                      </span>
                    </div>

                    <div className="font-medium text-slate-200 text-[11px] line-clamp-2 leading-snug">
                      {app.jobTitle}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 text-[10px] text-slate-300 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{app.cvLabel}</span>
                        {app.salary && (
                          <span className="text-emerald-400 font-medium truncate max-w-[110px]">
                            {app.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes display */}
                    {app.notes && editingNoteAppId !== app.id && (
                      <div className="p-1.5 rounded bg-slate-850 border border-slate-800 text-[11px] text-slate-300 italic flex items-start gap-1">
                        <MessageSquare className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{app.notes}</span>
                      </div>
                    )}

                    {/* Note Editor */}
                    {editingNoteAppId === app.id ? (
                      <div className="space-y-1.5 pt-1">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Ej: Entrevista técnica agendada para el jueves a las 10:00..."
                          className="w-full text-xs p-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-blue-500 resize-none h-16"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingNoteAppId(null)}
                            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(app)}
                            className="text-[10px] bg-blue-600 text-white px-2.5 py-0.5 rounded font-medium hover:bg-blue-500"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleStartEditNote(app)}
                          className="text-[10px] text-slate-400 hover:text-blue-400 inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span>{app.notes ? "Editar nota" : "+ Nota"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onViewLogs(app)}
                          className="text-[10px] text-slate-400 hover:text-white"
                        >
                          Logs
                        </button>
                      </div>
                    )}

                    {/* Stage Selector */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      <span className="text-[10px] text-slate-400">Mover a:</span>
                      <select
                        value={app.stage || "APPLIED"}
                        onChange={(e) =>
                          onUpdateStage(app.id, e.target.value as ApplicationStage, app.notes)
                        }
                        className="bg-slate-900 border border-slate-700 text-slate-200 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.stage} value={c.stage}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
