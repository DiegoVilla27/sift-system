"use client";

import React from "react";
import { Job } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  MapPin,
} from "lucide-react";

interface JobTableProps {
  jobs: Job[];
  onPostular: (job: Job) => void;
  onRechazar: (job: Job) => void;
  onViewDetails: (job: Job) => void;
  postulatingJobId?: string | null;
}

export function JobTable({
  jobs,
  onPostular,
  onRechazar,
  onViewDetails,
  postulatingJobId,
}: JobTableProps) {
  if (jobs.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#0a0f1e] border-b border-slate-800">
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Vacante</th>
            <th className="text-left px-3 py-3 text-slate-400 font-semibold">Empresa</th>
            <th className="text-left px-3 py-3 text-slate-400 font-semibold">Ubicación</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Modalidad</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Portal</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Score</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors"
            >
              {/* Título */}
              <td className="px-4 py-3 max-w-[260px]">
                <button
                  onClick={() => onViewDetails(job)}
                  className="text-slate-100 hover:text-blue-400 font-medium transition-colors text-left line-clamp-1"
                >
                  {job.title}
                </button>
              </td>

              {/* Empresa */}
              <td className="px-3 py-3 text-slate-300 truncate max-w-[140px]">
                {job.company}
              </td>

              {/* Ubicación */}
              <td className="px-3 py-3 text-slate-400">
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {job.location}
                </span>
              </td>

              {/* Modalidad */}
              <td className="px-3 py-3 text-center">
                <Badge
                  variant={job.modality === "REMOTE" ? "success" : "info"}
                  size="sm"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {job.modality === "REMOTE" ? "Remoto" : "Híbrido"}
                </Badge>
              </td>

              {/* Portal */}
              <td className="px-3 py-3 text-center">
                <Badge variant="outline" size="sm">
                  {job.sourcePlatform}
                </Badge>
              </td>

              {/* Score */}
              <td className="px-3 py-3 text-center">
                <MatchScorePill score={job.matchScore} />
              </td>

              {/* Acciones */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onPostular(job)}
                    isLoading={postulatingJobId === job.id}
                    className="text-[10px] px-2 py-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => onRechazar(job)}
                    className="text-[10px] px-2 py-1"
                  >
                    <XCircle className="w-3 h-3" />
                  </Button>
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
