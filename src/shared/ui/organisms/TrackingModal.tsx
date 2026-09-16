"use client";

import React, { useState } from "react";
import { PostulacionRecord, ApplicationStage } from "@/shared/types";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import {
  X,
  MessageSquarePlus,
  Clock,
  CheckCircle2,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

interface TrackingModalProps {
  application: PostulacionRecord;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (appId: string, note: string) => void;
  onUpdateStage: (appId: string, stage: ApplicationStage) => void;
}

const STAGES: { value: ApplicationStage; label: string; color: string }[] = [
  { value: "POSTULADA", label: "📩 Postulada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "EN_PROCESO", label: "⏳ En Proceso", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "ENTREVISTA", label: "🎙️ Entrevista", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "OFERTA", label: "🎉 Oferta", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "RECHAZADA", label: "❌ Rechazada", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
];

export function TrackingModal({
  application,
  isOpen,
  onClose,
  onAddNote,
  onUpdateStage,
}: TrackingModalProps) {
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    await onAddNote(application.id, noteText.trim());
    setNoteText("");
    setIsSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d1527] border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-800">
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white line-clamp-1">
              {application.jobTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {application.company} • {application.location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Stage Selector */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Etapa actual
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => onUpdateStage(application.id, value)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                    application.stage === value
                      ? color
                      : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Add Note */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 text-emerald-400" />
              Agregar nota de seguimiento
            </h4>
            <div className="flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ej: Me llamó Carla de RRHH, entrevista técnica el jueves 18..."
                rows={2}
                className="flex-1 bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={handleAddNote}
                isLoading={isSaving}
                className="self-end text-xs"
              >
                Guardar
              </Button>
            </div>
          </div>

          {/* Notes Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Historial de seguimiento
            </h4>

            {(!application.trackingNotes || application.trackingNotes.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                Sin notas de seguimiento todavía.
              </p>
            ) : (
              <div className="space-y-2.5">
                {application.trackingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="relative pl-4 border-l-2 border-slate-700 py-1"
                  >
                    <span className="text-[10px] text-slate-500 block mb-0.5">
                      {formatDate(note.createdAt)}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {note.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="pt-3 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3 h-3" />
                Postulada: {formatDate(application.appliedAt)}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3 h-3" />
                Portal: {application.sourcePlatform}
              </div>
            </div>
            {application.sourceUrl && (
              <a
                href={application.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 mt-2 inline-block"
              >
                Ver oferta original →
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
