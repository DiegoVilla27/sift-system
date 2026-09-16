"use client";

import React from "react";
import { Job } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import {
  MapPin,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Globe,
} from "lucide-react";

interface JobCardProps {
  job: Job;
  onPostular: (job: Job) => void;
  onRechazar: (job: Job) => void;
  onViewDetails: (job: Job) => void;
  isPostulating?: boolean;
}

export function JobCard({
  job,
  onPostular,
  onRechazar,
  onViewDetails,
  isPostulating,
}: JobCardProps) {
  return (
    <div className="group relative flex flex-col gap-3 p-4 rounded-xl border border-slate-800 bg-[#0d1527] hover:border-slate-700 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => onViewDetails(job)}
            className="text-sm font-bold text-white hover:text-blue-400 transition-colors text-left line-clamp-2"
          >
            {job.title}
          </button>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
        </div>
        <MatchScorePill score={job.matchScore} />
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" size="sm">
          <MapPin className="w-3 h-3 mr-1" />
          {job.location}
        </Badge>
        <Badge
          variant={job.modality === "REMOTE" ? "success" : "info"}
          size="sm"
        >
          <Globe className="w-3 h-3 mr-1" />
          {job.modality === "REMOTE" ? "Remoto" : "Híbrido"}
        </Badge>
        <Badge variant="accent" size="sm">
          {job.sourcePlatform}
        </Badge>
      </div>

      {/* Stack */}
      {job.stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700"
            >
              {tech}
            </span>
          ))}
          {job.stack.length > 5 && (
            <span className="px-2 py-0.5 text-[10px] text-slate-500">
              +{job.stack.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 mt-auto">
        <Button
          size="sm"
          variant="success"
          onClick={() => onPostular(job)}
          isLoading={isPostulating}
          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
        >
          Postular
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => onRechazar(job)}
          leftIcon={<XCircle className="w-3.5 h-3.5" />}
          className="flex-1 text-xs"
        >
          Rechazar
        </Button>
        <a
          href={job.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
          title="Abrir en el portal original"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
