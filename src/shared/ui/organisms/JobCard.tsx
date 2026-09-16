"use client";

import React from "react";
import { Job } from "@/shared/types";
import { Card } from "@/shared/ui/atoms/Card";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import { ScoreBreakdown } from "@/shared/ui/molecules/ScoreBreakdown";
import {
  Globe,
  Building2,
  Send,
  Eye,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";

export interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  onAutoApply: (job: Job) => void;
  onMarkManualApplied?: (job: Job) => void;
  onDismiss?: (job: Job) => void;
  onRestore?: (job: Job) => void;
  isApplying?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
  onAutoApply,
  onMarkManualApplied,
  onDismiss,
  onRestore,
  isApplying = false,
}) => {
  const isApplied = job.isApplied;
  const isSpain = job.assignedCvId === "CV_ES";

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full group border-slate-800">
      <div>
        {/* Top Header: Score & Modality */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <MatchScorePill score={job.matchScore} size="sm" />
          
          <div className="flex items-center gap-1.5">
            <Badge variant={job.modality === "REMOTE" ? "success" : "info"} size="sm">
              {job.modality === "REMOTE" ? (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Remoto
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Híbrido
                </span>
              )}
            </Badge>

            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 bg-slate-900/80 border-slate-700 text-slate-200"
              title={job.cvAssignmentReason}
            >
              <span>{isSpain ? "🇪🇸" : "🇨🇴"}</span>
              <span>{isSpain ? "CV España" : "CV Colombia"}</span>
            </span>
          </div>
        </div>

        {/* Title & Company */}
        <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
          {job.title}
        </h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
          <span className="text-slate-300 font-semibold">{job.company}</span>
          <span>•</span>
          <span>{job.location}</span>
          {job.salaryRange && (
            <>
              <span>•</span>
              <span className="text-emerald-400 font-mono">
                {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()} {job.salaryRange.currency}
              </span>
            </>
          )}
        </p>

        {/* Link directo y visible a la oferta original */}
        <div className="mt-2.5">
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-medium transition-all group/link max-w-full"
            title={`Abrir vacante original en ${job.sourcePlatform}`}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-blue-400 group-hover/link:translate-x-0.5 transition-transform" />
            <span className="truncate">
              Ver oferta en <strong className="font-semibold text-white">{job.sourcePlatform}</strong> ↗
            </span>
          </a>
        </div>

        {/* AI Match Reason Highlight */}
        <div className="mt-3 p-2.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-xs text-slate-300 flex items-start gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="line-clamp-2 leading-relaxed">
            {job.matchReasons[0] || "Afinidad alta con tu stack principal de Frontend."}
          </p>
        </div>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {job.stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/40"
            >
              {tech}
            </span>
          ))}
          {job.stack.length > 5 && (
            <span className="text-[10px] text-slate-400 px-1 py-0.5 self-center">
              +{job.stack.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(job)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="text-xs text-slate-300"
          >
            Detalles
          </Button>

          {onDismiss && !isApplied && !job.isDismissed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(job)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Descartar esta oferta para no volver a verla"
            >
              Descartar
            </Button>
          )}

          {job.isDismissed && onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(job)}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-400" />}
              className="text-xs text-slate-300 hover:text-blue-300"
            >
              Restaurar
            </Button>
          )}
        </div>

        {job.isDismissed ? (
          <Badge variant="warning" size="md" className="gap-1.5 py-1.5 px-3 text-xs">
            Descartada
          </Badge>
        ) : isApplied ? (
          <Badge variant="success" size="md" className="gap-1.5 py-1.5 px-3 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> Postulada
          </Badge>
        ) : (
          <div className="flex items-center gap-1.5">
            {onMarkManualApplied && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkManualApplied(job)}
                leftIcon={<CheckSquare className="w-3.5 h-3.5 text-emerald-400" />}
                className="text-xs text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40"
                title="Marcar como postulada si aplicaste manualmente tú mismo en el portal"
              >
                Ya me postulé
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              isLoading={isApplying}
              onClick={() => onAutoApply(job)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Postular Auto
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
