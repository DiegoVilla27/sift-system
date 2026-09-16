"use client";

import React from "react";
import { Job, CVId } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import {
  ExternalLink,
  Eye,
  Send,
  CheckCircle2,
  Globe,
  Building2,
  CheckSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface JobTableProps {
  jobs: Job[];
  onViewDetails: (job: Job) => void;
  onAutoApply: (job: Job) => void;
  onMarkManualApplied?: (job: Job) => void;
  onDismiss?: (job: Job) => void;
  onRestore?: (job: Job) => void;
  applyingJobId?: string | null;
}

export const JobTable: React.FC<JobTableProps> = ({
  jobs,
  onViewDetails,
  onAutoApply,
  onMarkManualApplied,
  onDismiss,
  onRestore,
  applyingJobId,
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1527] shadow-lg">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <th className="py-3 px-4">Puesto / Rol</th>
            <th className="py-3 px-4">Empresa & Portal</th>
            <th className="py-3 px-4">Ubicación / Modalidad</th>
            <th className="py-3 px-4 text-center">Afinidad IA</th>
            <th className="py-3 px-4">CV Asignada</th>
            <th className="py-3 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {jobs.map((job) => {
            const isApplying = applyingJobId === job.id;
            const isRemote = job.modality === "REMOTE";

            return (
              <tr
                key={job.id}
                className="hover:bg-slate-800/30 transition-colors group"
              >
                {/* 1. Rol */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {job.title}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {job.stack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </td>

                {/* 2. Empresa & Portal */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="font-medium text-slate-200">{job.company}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>{job.sourcePlatform}</span>
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-400 inline-flex items-center"
                      title="Abrir oferta original"
                    >
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                    </a>
                  </div>
                </td>

                {/* 3. Ubicación & Modalidad */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="text-slate-300 flex items-center gap-1">
                    {isRemote ? (
                      <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                    ) : (
                      <Building2 className="w-3 h-3 text-sky-400 shrink-0" />
                    )}
                    <span className="truncate max-w-[160px]">{job.location}</span>
                  </div>
                  <Badge
                    variant={isRemote ? "success" : "info"}
                    size="sm"
                    className="mt-1 text-[10px]"
                  >
                    {isRemote ? "100% Remoto" : "Híbrido"}
                  </Badge>
                </td>

                {/* 4. Match Score */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <MatchScorePill score={job.matchScore} size="sm" />
                </td>

                {/* 5. CV Asignada */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">
                      {job.assignedCvId === "CV_ES" ? "🇪🇸" : "🇨🇴"}
                    </span>
                    <span className="text-slate-300 font-medium text-[11px]">
                      {job.assignedCvId === "CV_ES" ? "CV España" : "CV Colombia"}
                    </span>
                  </div>
                </td>

                {/* 6. Acciones */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(job)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      className="text-xs"
                      title="Ver Detalles y Carta de Presentación"
                    >
                      Ver
                    </Button>

                    {onDismiss && !job.isApplied && !job.isDismissed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDismiss(job)}
                        leftIcon={<Trash2 className="w-3 h-3" />}
                        className="text-[11px] px-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Descartar esta oferta para no volver a verla"
                      >
                        Descartar
                      </Button>
                    )}

                    {job.isDismissed ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="warning" size="sm" className="gap-1 py-1 px-2 text-[11px]">
                          Descartada
                        </Badge>
                        {onRestore && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRestore(job)}
                            leftIcon={<RotateCcw className="w-3 h-3 text-blue-400" />}
                            className="text-[11px] px-2 text-slate-300 hover:text-blue-300"
                            title="Restaurar a ofertas disponibles"
                          >
                            Restaurar
                          </Button>
                        )}
                      </div>
                    ) : job.isApplied ? (
                      <Badge variant="success" size="sm" className="gap-1 py-1 px-2.5 text-[11px]">
                        <CheckCircle2 className="w-3 h-3" /> Postulada
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {onMarkManualApplied && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onMarkManualApplied(job)}
                            leftIcon={<CheckSquare className="w-3 h-3 text-emerald-400" />}
                            className="text-[11px] px-2 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40"
                            title="Marcar como postulada si aplicaste manualmente tú mismo"
                          >
                            Ya apliqué
                          </Button>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isApplying}
                          onClick={() => onAutoApply(job)}
                          leftIcon={<Send className="w-3 h-3" />}
                          className="text-[11px] px-2.5"
                          title="Postulación automática 1-Clic"
                        >
                          Auto
                        </Button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
