"use client";

import React from "react";
import { PostulacionRecord, ApplicationStage } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { formatDate } from "@/shared/lib/utils";
import {
  MessageSquarePlus,
  ExternalLink,
  MapPin,
  Globe,
} from "lucide-react";

interface ApplicationTableProps {
  applications: PostulacionRecord[];
  onOpenTracking: (app: PostulacionRecord) => void;
}

const STAGE_STYLES: Record<ApplicationStage, string> = {
  POSTULADA: "bg-blue-500/20 text-blue-400",
  EN_PROCESO: "bg-amber-500/20 text-amber-400",
  ENTREVISTA: "bg-purple-500/20 text-purple-400",
  OFERTA: "bg-emerald-500/20 text-emerald-400",
  RECHAZADA: "bg-rose-500/20 text-rose-400",
};

const STAGE_LABELS: Record<ApplicationStage, string> = {
  POSTULADA: "📩 Postulada",
  EN_PROCESO: "⏳ En Proceso",
  ENTREVISTA: "🎙️ Entrevista",
  OFERTA: "🎉 Oferta",
  RECHAZADA: "❌ Rechazada",
};

export function ApplicationTable({
  applications,
  onOpenTracking,
}: ApplicationTableProps) {
  if (applications.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#0a0f1e] border-b border-slate-800">
            <th className="text-left px-4 py-3 text-slate-400 font-semibold">Puesto</th>
            <th className="text-left px-3 py-3 text-slate-400 font-semibold">Empresa</th>
            <th className="text-left px-3 py-3 text-slate-400 font-semibold">Ubicación</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Modalidad</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Portal</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Etapa</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Fecha</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Notas</th>
            <th className="text-center px-3 py-3 text-slate-400 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className="border-b border-slate-800/60 hover:bg-slate-800/20 transition-colors"
            >
              <td className="px-4 py-3 max-w-[220px]">
                <span className="text-slate-100 font-medium line-clamp-1">
                  {app.jobTitle}
                </span>
              </td>
              <td className="px-3 py-3 text-slate-300 truncate max-w-[130px]">
                {app.company}
              </td>
              <td className="px-3 py-3 text-slate-400">
                <span className="flex items-center gap-1 truncate max-w-[130px]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {app.location}
                </span>
              </td>
              <td className="px-3 py-3 text-center">
                <Badge
                  variant={app.modality === "REMOTE" ? "success" : "info"}
                  size="sm"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  {app.modality === "REMOTE" ? "Remoto" : "Híbrido"}
                </Badge>
              </td>
              <td className="px-3 py-3 text-center">
                <Badge variant="outline" size="sm">
                  {app.sourcePlatform}
                </Badge>
              </td>
              <td className="px-3 py-3 text-center">
                <span
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold ${
                    STAGE_STYLES[app.stage] || STAGE_STYLES.POSTULADA
                  }`}
                >
                  {STAGE_LABELS[app.stage] || app.stage}
                </span>
              </td>
              <td className="px-3 py-3 text-center text-slate-400">
                {formatDate(app.appliedAt)}
              </td>
              <td className="px-3 py-3 text-center">
                <span className="text-slate-400 text-[10px]">
                  {app.trackingNotes?.length || 0}
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenTracking(app)}
                    className="text-[10px] px-2 py-1"
                    title="Gestionar seguimiento"
                  >
                    <MessageSquarePlus className="w-3 h-3" />
                  </Button>
                  {app.sourceUrl && (
                    <a
                      href={app.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
