"use client";

import React from "react";
import { ApplicationRecord } from "@/shared/types";
import { Card } from "@/shared/ui/atoms/Card";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { MatchScorePill } from "@/shared/ui/atoms/MatchScorePill";
import {
  Calendar,
  Building2,
  DollarSign,
  FileText,
  FileCode,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ApplicationCardGridProps {
  applications: ApplicationRecord[];
  onViewLogs: (app: ApplicationRecord) => void;
}

export const ApplicationCardGrid: React.FC<ApplicationCardGridProps> = ({
  applications,
  onViewLogs,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {applications.map((app) => {
        const isSuccess = app.status === "SUCCESS";
        const dateFormatted = new Date(app.appliedAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Card
            key={app.id}
            className="border-slate-800 hover:border-slate-700 transition-all p-5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header: Company & Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white text-sm line-clamp-1">
                    {app.company}
                  </div>
                  {app.portalUrl && (
                    <div className="pt-1">
                      <a
                        href={app.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 hover:text-blue-300 text-[11px] font-medium transition-colors"
                        title={`Abrir vacante original en ${app.sourcePlatform}`}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span>Ver oferta en {app.sourcePlatform} ↗</span>
                      </a>
                    </div>
                  )}
                </div>

                <Badge variant={isSuccess ? "success" : "danger"} size="sm" className="gap-1 shrink-0">
                  {isSuccess ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {isSuccess ? "Completada" : "Fallida"}
                </Badge>
              </div>

              {/* Job Title */}
              <div>
                <h3 className="text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                  {app.jobTitle}
                </h3>
              </div>

              {/* Details: Date, Location, CV, Salary */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{dateFormatted}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <FileText className="w-3 h-3 text-purple-400 shrink-0" />
                  <span className="text-slate-300">{app.cvLabel}</span>
                </div>

                {app.salary && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <DollarSign className="w-3 h-3 shrink-0" />
                    <span>{app.salary}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: Score & Logs Button */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <MatchScorePill score={app.matchScore} size="sm" />

              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewLogs(app)}
                leftIcon={<FileCode className="w-3.5 h-3.5 text-blue-400" />}
                className="text-xs"
              >
                Ver Logs ({app.logs.length})
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
