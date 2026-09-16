"use client";

import React, { useState } from "react";
import { ApplicationRecord } from "@/shared/types";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { formatDate } from "@/shared/lib/utils";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileCode,
  Globe,
  Building2,
} from "lucide-react";

export interface ApplicationTableProps {
  applications: ApplicationRecord[];
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({ applications }) => {
  const [selectedAppLogs, setSelectedAppLogs] = useState<ApplicationRecord | null>(null);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#0d1527]/90">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Vacante & Empresa</th>
              <th className="py-3 px-4">Modalidad</th>
              <th className="py-3 px-4">CV Despachada</th>
              <th className="py-3 px-4">Salario</th>
              <th className="py-3 px-4">Score</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Fecha Postulación</th>
              <th className="py-3 px-4 text-right">Auditoría / ATS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {applications.map((app) => {
              const isES = app.cvUsed === "CV_ES";
              return (
                <tr key={app.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{app.jobTitle}</div>
                    <div className="text-slate-400 text-[11px]">{app.company} • {app.location}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={app.modality === "REMOTE" ? "success" : "info"} size="sm">
                      {app.modality === "REMOTE" ? "Remoto" : "Híbrido"}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
                      <span>{isES ? "🇪🇸" : "🇨🇴"}</span>
                      <span>{isES ? "CV España" : "CV Colombia"}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                    {app.salary || "En rango esperado"}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-emerald-400">
                    {app.matchScore}%
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Enviada 100% Auto
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {formatDate(app.appliedAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAppLogs(app)}
                        leftIcon={<FileCode className="w-3.5 h-3.5 text-blue-400" />}
                        className="text-xs"
                      >
                        Logs
                      </Button>
                      <a
                        href={app.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title="Ver en portal ATS"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Log Details Modal */}
      {selectedAppLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0d1527] border border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Logs de Postulación Automática
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedAppLogs.jobTitle} en {selectedAppLogs.company}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppLogs(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Cerrar
              </button>
            </div>

            <div className="bg-[#090d16] p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-2 max-h-60 overflow-y-auto">
              {selectedAppLogs.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span
                    className={
                      log.level === "SUCCESS"
                        ? "text-emerald-400"
                        : log.level === "WARN"
                        ? "text-amber-400"
                        : log.level === "ERROR"
                        ? "text-red-400"
                        : "text-slate-300"
                    }
                  >
                    [{log.level}]
                  </span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>CV Enviada: <strong>{selectedAppLogs.cvLabel}</strong></span>
              <a
                href={selectedAppLogs.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                Abrir Portal ATS <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
