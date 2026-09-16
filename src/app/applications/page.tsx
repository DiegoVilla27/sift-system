"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ApplicationRecord, ApplicationStage } from "@/shared/types";
import { ApplicationTable } from "@/shared/ui/organisms/ApplicationTable";
import { ApplicationCardGrid } from "@/shared/ui/organisms/ApplicationCardGrid";
import { KanbanBoard } from "@/shared/ui/organisms/KanbanBoard";
import { ViewModeToggle, ViewMode } from "@/shared/ui/molecules/ViewModeToggle";
import { StatCard } from "@/shared/ui/molecules/StatCard";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  CheckCircle2,
  Send,
  ShieldCheck,
  FileText,
  ArrowRight,
  RefreshCw,
  Download,
  X,
  FileCode,
  Plus,
  Building2,
  Briefcase,
  Link2,
} from "lucide-react";
import { CVId } from "@/shared/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedAppLogs, setSelectedAppLogs] = useState<ApplicationRecord | null>(null);

  // Manual Application Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualForm, setManualForm] = useState({
    company: "",
    jobTitle: "",
    portalUrl: "",
    sourcePlatform: "LinkedIn",
    cvUsed: "CV_ES" as CVId,
    modality: "REMOTE" as "REMOTE" | "HYBRID" | "ON_SITE",
    salary: "",
    location: "España",
    notes: "",
  });

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStage = async (appId: string, newStage: ApplicationStage, notes?: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, stage: newStage, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) =>
          prev.map((a) =>
            a.id === appId
              ? { ...a, stage: newStage, ...(notes !== undefined ? { notes } : {}) }
              : a
          )
        );
      }
    } catch (err) {
      console.error("Error updating application stage:", err);
    }
  };

  const handleCreateManualApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.company || !manualForm.jobTitle) {
      alert("Por favor indica al menos el nombre de la empresa y el puesto");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: manualForm.company.trim(),
          jobTitle: manualForm.jobTitle.trim(),
          portalUrl: manualForm.portalUrl.trim(),
          sourcePlatform: manualForm.sourcePlatform,
          cvUsed: manualForm.cvUsed,
          modality: manualForm.modality,
          salary: manualForm.salary.trim(),
          location: manualForm.location.trim(),
          notes: manualForm.notes.trim() || "Postulación registrada manualmente por Diego",
        }),
      });

      const data = await res.json();
      if (data.success && data.record) {
        setApplications((prev) => [data.record, ...prev]);
        setIsCreateModalOpen(false);
        setManualForm({
          company: "",
          jobTitle: "",
          portalUrl: "",
          sourcePlatform: "LinkedIn",
          cvUsed: "CV_ES",
          modality: "REMOTE",
          salary: "",
          location: "España",
          notes: "",
        });
      } else {
        alert(data.error || "No se pudo registrar la postulación");
      }
    } catch (err) {
      console.error("Error creating manual application:", err);
      alert("Ocurrió un error de conexión al guardar la postulación");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleExportCsv = () => {
    if (applications.length === 0) return;
    const headers = [
      "ID",
      "Empresa",
      "Rol",
      "Ubicacion",
      "Modalidad",
      "CV Usada",
      "Salario",
      "Score",
      "Fecha Postulacion",
      "Estado",
      "Portal URL",
    ];

    const rows = applications.map((a) => [
      a.id,
      `"${a.company.replace(/"/g, '""')}"`,
      `"${a.jobTitle.replace(/"/g, '""')}"`,
      `"${a.location.replace(/"/g, '""')}"`,
      a.modality,
      a.cvUsed,
      `"${a.salary || ''}"`,
      `${a.matchScore}%`,
      a.appliedAt,
      a.status,
      `"${a.portalUrl}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `postulaciones_diego_villanueva_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalApplied = applications.length;
  const esCount = applications.filter((a) => a.cvUsed === "CV_ES").length;
  const coCount = applications.filter((a) => a.cvUsed === "CV_CO").length;
  const successCount = applications.filter((a) => a.status === "SUCCESS").length;

  return (
    <div className="space-y-6">
      {/* Title & View Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Historial de Postulaciones 100% Automáticas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro persistente en disco (storage/applications.json) con empresa, rol, salario, CV despachada y fecha exacta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs shadow-md shadow-blue-500/20"
          >
            + Registrar Postulación
          </Button>

          <ViewModeToggle mode={viewMode} onChange={setViewMode} showKanban={true} />

          {totalApplied > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
              className="text-xs"
              title="Descargar historial en archivo CSV para Excel"
            >
              Exportar CSV
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={fetchApplications}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
            className="text-xs"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Postuladas"
          value={totalApplied}
          subtitle={totalApplied > 0 ? "Formularios completados" : "Sin postulaciones aún"}
          icon={<Send className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="Exitosas"
          value={successCount}
          subtitle={totalApplied > 0 ? `${((successCount / totalApplied) * 100).toFixed(0)}% tasa de éxito` : "0%"}
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />
        <StatCard
          title="CV España 🇪🇸"
          value={esCount}
          subtitle="Envíos con DNI/NIE"
          icon={<FileText className="w-5 h-5" />}
          variant="purple"
        />
        <StatCard
          title="CV Colombia 🇨🇴"
          value={coCount}
          subtitle="Envíos con Cédula"
          icon={<FileText className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* CV Dispatch Integrity Banner */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <p className="font-semibold text-emerald-300">
            Persistencia de Auditoría Activa
          </p>
          <p className="text-slate-400">
            Toda postulación ejecutada por Playwright o mediante 1-clic se almacena en el disco duro de tu máquina en{" "}
            <code className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">storage/applications.json</code>. No se pierde al cerrar la web ni al reiniciar el servidor.
          </p>
        </div>
      </div>

      {/* Applications Table, Kanban or Grid */}
      {applications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-3">
          <p className="text-sm text-slate-400">Aún no se han ejecutado postulaciones automáticas.</p>
          <Link href="/jobs">
            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="text-xs">
              Ir al Explorador de Vacantes
            </Button>
          </Link>
        </div>
      ) : viewMode === "table" ? (
        <ApplicationTable applications={applications} />
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          applications={applications}
          onUpdateStage={handleUpdateStage}
          onViewLogs={(app) => setSelectedAppLogs(app)}
        />
      ) : (
        <ApplicationCardGrid
          applications={applications}
          onViewLogs={(app) => setSelectedAppLogs(app)}
        />
      )}

      {/* Logs Modal for Card Grid view */}
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
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs pr-1">
              {selectedAppLogs.logs.map((log, i) => (
                <div
                  key={i}
                  className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-start gap-2.5"
                >
                  <span className="text-slate-500 text-[11px] shrink-0 font-sans">
                    {log.timestamp}
                  </span>
                  <span
                    className={`font-semibold text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      log.level === "SUCCESS"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : log.level === "WARN"
                        ? "bg-amber-500/20 text-amber-400"
                        : log.level === "ERROR"
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-300 leading-relaxed text-[11px]">
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAppLogs(null)}
                className="text-xs"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Postulación Manual */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Registrar Postulación Manual
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guarda en disco vacantes a las que aplicaste por tu cuenta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualApplication} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Cabify, Glovo, Mercado Libre"
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Puesto / Rol *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Senior Frontend Engineer"
                    value={manualForm.jobTitle}
                    onChange={(e) => setManualForm({ ...manualForm, jobTitle: e.target.value })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Enlace / URL de la vacante</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/jobs/view/... o https://infojobs.net/..."
                  value={manualForm.portalUrl}
                  onChange={(e) => setManualForm({ ...manualForm, portalUrl: e.target.value })}
                  className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Portal / Origen</label>
                  <select
                    value={manualForm.sourcePlatform}
                    onChange={(e) => setManualForm({ ...manualForm, sourcePlatform: e.target.value })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="InfoJobs">InfoJobs</option>
                    <option value="CompuTrabajo">CompuTrabajo</option>
                    <option value="Greenhouse">Greenhouse</option>
                    <option value="Lever">Lever</option>
                    <option value="Get on Board">Get on Board</option>
                    <option value="Torre">Torre</option>
                    <option value="Manual">Otro / Directo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">CV Utilizada</label>
                  <select
                    value={manualForm.cvUsed}
                    onChange={(e) => setManualForm({ ...manualForm, cvUsed: e.target.value as CVId })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="CV_ES">🇪🇸 CV España (DNI)</option>
                    <option value="CV_CO">🇨🇴 CV Colombia (Cédula)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Modalidad</label>
                  <select
                    value={manualForm.modality}
                    onChange={(e) => setManualForm({ ...manualForm, modality: e.target.value as any })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="REMOTE">Remoto</option>
                    <option value="HYBRID">Híbrido</option>
                    <option value="ON_SITE">Presencial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Salario (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: 38.000 € / año o 7.000.000 COP"
                    value={manualForm.salary}
                    onChange={(e) => setManualForm({ ...manualForm, salary: e.target.value })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Ubicación</label>
                  <input
                    type="text"
                    placeholder="Ej: Madrid, España / Remoto LATAM"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Notas adicionales</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el contacto, fase o impresiones..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs"
                >
                  Guardar Postulación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
