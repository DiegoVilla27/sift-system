"use client";

import React from "react";
import { Job } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import {
  X,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  MapPin,
  Building2,
} from "lucide-react";

interface JobDetailDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onPostular: (job: Job) => void;
  onRechazar: (job: Job) => void;
  isPostulating?: boolean;
}

export function JobDetailDrawer({
  job,
  isOpen,
  onClose,
  onPostular,
  onRechazar,
  isPostulating,
}: JobDetailDrawerProps) {
  if (!job || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0d1527] border-l border-slate-800 shadow-2xl overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0d1527] border-b border-slate-800 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white line-clamp-2">
              {job.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Building2 className="w-3 h-3" />
              {job.company}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Score */}
          <div className="flex items-center gap-3">
            <MatchScorePill score={job.matchScore} />
            <span className="text-xs text-slate-400">
              Compatibilidad con tu perfil
            </span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" size="sm">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </Badge>
            <Badge
              variant={job.modality === "REMOTE" ? "success" : "info"}
              size="sm"
            >
              <Globe className="w-3 h-3 mr-1" />
              {job.modality === "REMOTE" ? "100% Remoto" : "Híbrido"}
            </Badge>
            <Badge variant="accent" size="sm">
              {job.sourcePlatform}
            </Badge>
          </div>

          {/* Stack */}
          {job.stack.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                Stack Tecnológico
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2">
              Descripción
            </h4>
            <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-1">
              {job.description}
            </div>
          </div>

          {/* Link al portal */}
          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver oferta en {job.sourcePlatform}
          </a>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-800">
            <Button
              size="sm"
              variant="success"
              onClick={() => onPostular(job)}
              isLoading={isPostulating}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              className="flex-1"
            >
              Postular
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                onRechazar(job);
                onClose();
              }}
              leftIcon={<XCircle className="w-4 h-4" />}
              className="flex-1"
            >
              Rechazar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
