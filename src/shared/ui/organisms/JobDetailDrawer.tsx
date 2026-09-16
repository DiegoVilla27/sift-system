"use client";

import React, { useState } from "react";
import { Job, CVId } from "@/shared/types";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  X,
  Send,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  MapPin,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";

export interface JobDetailDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onAutoApply: (job: Job, targetCvId: CVId) => void;
  onMarkManualApplied?: (job: Job, targetCvId: CVId) => void;
  onDismiss?: (job: Job) => void;
  onRestore?: (job: Job) => void;
  isApplying?: boolean;
}

export const JobDetailDrawer: React.FC<JobDetailDrawerProps> = ({
  job,
  isOpen,
  onClose,
  onAutoApply,
  onMarkManualApplied,
  onDismiss,
  onRestore,
  isApplying = false,
}) => {
  const [selectedCv, setSelectedCv] = useState<CVId | null>(null);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);

  if (!isOpen || !job) return null;

  const currentCv = selectedCv || job.assignedCvId;

  const handleCopy = () => {
    navigator.clipboard.writeText(job.generatedCoverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-[#0d1527] border-l border-slate-800 flex flex-col shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between sticky top-0 bg-[#0d1527]/95 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MatchScorePill score={job.matchScore} size="md" />
              <Badge variant={job.modality === "REMOTE" ? "success" : "info"}>
                {job.modality === "REMOTE" ? "100% Remoto" : "Modalidad Híbrida"}
              </Badge>
              <Badge variant="outline">{job.sourcePlatform}</Badge>
            </div>
            <h2 className="text-xl font-bold text-white">{job.title}</h2>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              <span className="text-slate-200 font-semibold">{job.company}</span>
              <span>•</span>
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{job.location}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Strict CV Assignment Module */}
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Enrutamiento de CV (0% Margen de Error)
                </h4>
              </div>
              <span className="text-xs text-blue-400 font-mono">Confianza: 100%</span>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              <strong className="text-white">Motivo de asignación:</strong> {job.cvAssignmentReason}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedCv("CV_ES")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  currentCv === "CV_ES"
                    ? "bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🇪🇸</span>
                  {currentCv === "CV_ES" && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">ACTIVO</span>}
                </div>
                <div className="text-xs font-bold text-slate-200 mt-1">CV España</div>
                <p className="text-[11px] text-slate-400">Diego_Villa_Frontend_Spain_CV.pdf (DNI/NIE)</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCv("CV_CO")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  currentCv === "CV_CO"
                    ? "bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">🇨🇴</span>
                  {currentCv === "CV_CO" && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">ACTIVO</span>}
                </div>
                <div className="text-xs font-bold text-slate-200 mt-1">CV Colombia</div>
                <p className="text-[11px] text-slate-400">Diego_Villa_Frontend_Colombia_CV.pdf (Cédula)</p>
              </button>
            </div>
          </div>

          {/* AI Match Reasons */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Por qué hace Match ({job.matchScore}%)
            </h4>
            <ul className="space-y-2">
              {job.matchReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack Required */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Stack Técnico Requerido
            </h4>
            <div className="flex flex-wrap gap-2">
              {job.stack.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* AI Generated Cover Letter */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Carta de Presentación Adaptada (IA)
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                leftIcon={copiedCoverLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {copiedCoverLetter ? "Copiada" : "Copiar"}
              </Button>
            </div>
            <p className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed bg-[#090d16] p-3 rounded-lg border border-slate-800/80">
              {job.generatedCoverLetter}
            </p>
          </div>

          {/* Description Excerpt */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Descripción Original de la Vacante
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed bg-[#090d16] p-3 rounded-lg border border-slate-800/80">
              {job.description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#090d16] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              Abrir en {job.sourcePlatform} <ExternalLink className="w-3 h-3" />
            </a>

            {onDismiss && !job.isApplied && !job.isDismissed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDismiss(job);
                  onClose();
                }}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                title="Descartar esta vacante"
              >
                Descartar Vacante
              </Button>
            )}

            {job.isDismissed && onRestore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRestore(job);
                  onClose();
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-400" />}
                className="text-xs text-slate-300 hover:text-blue-300"
              >
                Restaurar Vacante
              </Button>
            )}
          </div>

          {job.isDismissed ? (
            <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              <span>Esta vacante fue descartada</span>
            </div>
          ) : job.isApplied ? (
            <div className="flex items-center gap-2 py-1.5 px-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Esta vacante ya está registrada en tus Postulaciones</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {onMarkManualApplied && (
                <Button
                  variant="outline"
                  onClick={() => onMarkManualApplied(job, currentCv)}
                  leftIcon={<CheckSquare className="w-4 h-4 text-emerald-400" />}
                  className="text-xs text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40"
                  title="Registrar que ya aplicaste manualmente tú mismo a esta oferta"
                >
                  Marcar como Postulada
                </Button>
              )}

              <Button
                variant="primary"
                isLoading={isApplying}
                onClick={() => onAutoApply(job, currentCv)}
                leftIcon={<Send className="w-4 h-4" />}
                className="text-xs"
              >
                Postular 100% Automático
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
