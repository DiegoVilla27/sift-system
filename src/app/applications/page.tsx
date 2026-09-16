"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PostulacionRecord, ApplicationStage } from "@/shared/types";
import { ApplicationTable } from "@/shared/ui/organisms/ApplicationTable";
import { TrackingModal } from "@/shared/ui/organisms/TrackingModal";
import { StatCard } from "@/shared/ui/molecules/StatCard";
import { SearchBar } from "@/shared/ui/molecules/SearchBar";
import { Button } from "@/shared/ui/atoms/Button";
import {
  CheckCircle2,
  Send,
  Clock,
  ArrowRight,
  RefreshCw,
  Download,
  FileText,
  MessageSquarePlus,
  Filter,
  XCircle,
} from "lucide-react";

const STAGES: { value: ApplicationStage | "ALL"; label: string; icon: string }[] = [
  { value: "ALL", label: "Todas", icon: "📋" },
  { value: "POSTULADA", label: "Postulada", icon: "📩" },
  { value: "EN_PROCESO", label: "En Proceso", icon: "⏳" },
  { value: "ENTREVISTA", label: "Entrevista", icon: "🎙️" },
  { value: "OFERTA", label: "Oferta", icon: "🎉" },
  { value: "RECHAZADA", label: "Rechazada", icon: "❌" },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<PostulacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PostulacionRecord | null>(null);
  const [stageFilter, setStageFilter] = useState<ApplicationStage | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStage = async (appId: string, stage: ApplicationStage) => {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, stage }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, stage } : a))
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, stage } : null));
        }
      }
    } catch (err) {
      console.error("Error updating stage:", err);
    }
  };

  const handleAddNote = async (appId: string, noteText: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, note: noteText }),
      });
      const data = await res.json();
      if (data.success && data.note) {
        setApplications((prev) =>
          prev.map((a) => {
            if (a.id === appId) {
              return {
                ...a,
                trackingNotes: [data.note, ...(a.trackingNotes || [])],
              };
            }
            return a;
          })
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) =>
            prev
              ? {
                  ...prev,
                  trackingNotes: [data.note, ...(prev.trackingNotes || [])],
                }
              : null
          );
        }
      }
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const handleExportCsv = () => {
    if (applications.length === 0) return;
    const headers = ["Empresa", "Puesto", "Ubicación", "Modalidad", "Portal", "Etapa", "Fecha", "Notas"];
    const rows = applications.map((a) => [
      `"${a.company.replace(/"/g, '""')}"`,
      `"${a.jobTitle.replace(/"/g, '""')}"`,
      `"${a.location.replace(/"/g, '""')}"`,
      a.modality,
      a.sourcePlatform,
      a.stage,
      a.appliedAt,
      `"${(a.trackingNotes || []).map((n) => n.text).join(" | ").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `postulaciones_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const total = applications.length;
  const postuladas = applications.filter((a) => a.stage === "POSTULADA").length;
  const enProceso = applications.filter((a) => a.stage === "EN_PROCESO").length;
  const entrevistas = applications.filter((a) => a.stage === "ENTREVISTA").length;
  const ofertas = applications.filter((a) => a.stage === "OFERTA").length;
  const rechazadas = applications.filter((a) => a.stage === "RECHAZADA").length;

  // Filtrar postulaciones por etapa y texto de búsqueda
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (stageFilter !== "ALL" && app.stage !== stageFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = app.jobTitle.toLowerCase().includes(q);
        const matchesCompany = app.company.toLowerCase().includes(q);
        const matchesLocation = app.location.toLowerCase().includes(q);
        const matchesPlatform = app.sourcePlatform.toLowerCase().includes(q);
        const matchesNotes = (app.trackingNotes || []).some((n) =>
          n.text.toLowerCase().includes(q)
        );
        return (
          matchesTitle ||
          matchesCompany ||
          matchesLocation ||
          matchesPlatform ||
          matchesNotes
        );
      }
      return true;
    });
  }, [applications, stageFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Mis Postulaciones
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona tus candidaturas, filtra por etapa, añade notas de seguimiento y controla el estado de cada proceso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {total > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5 text-emerald-400" />}
              className="text-xs"
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

      {/* Metrics (Interactivas para filtrar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStageFilter("ALL")}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title="Total Postuladas"
            value={total}
            subtitle="Haz clic para ver todas"
            icon={<Send className="w-5 h-5" />}
            variant="blue"
          />
        </div>

        <div
          onClick={() => setStageFilter("EN_PROCESO")}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title="En Proceso"
            value={enProceso + postuladas}
            subtitle={`${postuladas} postuladas • ${enProceso} en curso`}
            icon={<Clock className="w-5 h-5" />}
            variant="amber"
          />
        </div>

        <div
          onClick={() => setStageFilter("ENTREVISTA")}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title="Entrevistas"
            value={entrevistas}
            subtitle="Programadas o completadas"
            icon={<MessageSquarePlus className="w-5 h-5" />}
            variant="purple"
          />
        </div>

        <div
          onClick={() => setStageFilter("OFERTA")}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard
            title="Ofertas"
            value={ofertas}
            subtitle={ofertas > 0 ? "¡Felicitaciones!" : "Ninguna aún"}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="emerald"
          />
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro por Etapas */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1527] space-y-3">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar por empresa, puesto, notas de seguimiento o portal..."
        />

        {/* Píldoras de Filtro por Etapa */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Etapa:
          </span>

          {STAGES.map((s) => {
            const count =
              s.value === "ALL"
                ? total
                : s.value === "POSTULADA"
                ? postuladas
                : s.value === "EN_PROCESO"
                ? enProceso
                : s.value === "ENTREVISTA"
                ? entrevistas
                : s.value === "OFERTA"
                ? ofertas
                : rechazadas;

            const isSelected = stageFilter === s.value;

            return (
              <button
                key={s.value}
                onClick={() => setStageFilter(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-700/60 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-3">
          <FileText className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400">
            Aún no tienes postulaciones registradas.
          </p>
          <p className="text-xs text-slate-500">
            Ve a la pestaña de Vacantes, busca ofertas y pulsa &quot;Postular&quot; para agregarlas aquí.
          </p>
          <Link href="/jobs">
            <Button
              size="sm"
              variant="primary"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Ir a Buscar Vacantes
            </Button>
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-2">
          <p className="text-sm text-slate-400">
            No hay postulaciones en la etapa seleccionada ({stageFilter}) o que coincidan con la búsqueda.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setStageFilter("ALL");
              setSearchQuery("");
            }}
            className="text-xs"
          >
            Limpiar Filtros
          </Button>
        </div>
      ) : (
        <ApplicationTable
          applications={filteredApplications}
          onOpenTracking={(app) => setSelectedApp(app)}
        />
      )}

      {/* Tracking Modal */}
      {selectedApp && (
        <TrackingModal
          application={selectedApp}
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          onAddNote={handleAddNote}
          onUpdateStage={handleUpdateStage}
        />
      )}
    </div>
  );
}
