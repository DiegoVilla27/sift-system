"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Job, CVId } from "@/shared/types";
import { StatCard } from "@/shared/ui/molecules/StatCard";
import { ViewModeToggle, ViewMode } from "@/shared/ui/molecules/ViewModeToggle";
import { JobCard } from "@/shared/ui/organisms/JobCard";
import { JobTable } from "@/shared/ui/organisms/JobTable";
import { JobDetailDrawer } from "@/shared/ui/organisms/JobDetailDrawer";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Briefcase,
  Send,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Bell,
  Zap,
  Radio,
} from "lucide-react";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsCount, setApplicationsCount] = useState<number>(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Cargar vacantes reales y aplicaciones reales desde storage en el cliente
  useEffect(() => {
    fetch("/api/ingestion/run")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      })
      .catch(() => {});

    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          setApplicationsCount(data.applications.length);
        }
      })
      .catch(() => {});
  }, []);

  const handleRunLiveIngestion = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch("/api/ingestion/run", { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleOpenDetails = (job: Job) => {
    setSelectedJob(job);
    setIsDrawerOpen(true);
  };

  const handleAutoApply = async (job: Job, targetCvId?: CVId) => {
    setApplyingJobId(job.id);
    try {
      const res = await fetch("/api/apply/real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobUrl: job.sourceUrl,
          companyName: job.company,
          jobTitle: job.title,
          cvRegion: targetCvId || job.assignedCvId,
          coverLetterText: job.generatedCoverLetter,
          dryRun: false,
        }),
      });

      if (res.ok) {
        // Quitar de la vista del dashboard de inmediato al postularse
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        setApplicationsCount((prev) => prev + 1);
        if (selectedJob?.id === job.id) {
          setSelectedJob(null);
          setIsDrawerOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleMarkManualApplied = async (job: Job, targetCvId?: CVId) => {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          modality: job.modality,
          cvUsed: targetCvId || job.assignedCvId,
          sourcePlatform: job.sourcePlatform,
          portalUrl: job.sourceUrl,
          notes: "Postulación manual realizada por Diego directamente",
        }),
      });

      if (res.ok) {
        // Quitar de la vista del dashboard de inmediato al registrar postulación
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        setApplicationsCount((prev) => prev + 1);
        if (selectedJob?.id === job.id) {
          setSelectedJob(null);
          setIsDrawerOpen(false);
        }
      }
    } catch (err) {
      console.error("Error al registrar postulación manual:", err);
    }
  };

  const handleDismissJob = async (job: Job) => {
    // Quitar de inmediato de la lista para feedback instantáneo
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    if (selectedJob?.id === job.id) {
      setSelectedJob(null);
      setIsDrawerOpen(false);
    }
    try {
      await fetch("/api/jobs/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          company: job.company,
          title: job.title,
          sourceUrl: job.sourceUrl,
        }),
      });
    } catch (err) {
      console.error("Error al descartar oferta:", err);
    }
  };

  // Solo mostrar vacantes disponibles: no postuladas y no descartadas
  const availableJobs = jobs.filter((j) => !j.isApplied && !j.isDismissed);
  const total = availableJobs.length;
  const highMatchJobs = availableJobs.filter((j) => j.matchScore >= 70);
  const remoteCount = availableJobs.filter((j) => j.modality === "REMOTE").length;
  const hybridCount = availableJobs.filter((j) => j.modality === "HYBRID").length;
  const esCvs = availableJobs.filter((j) => j.assignedCvId === "CV_ES").length;
  const coCvs = availableJobs.filter((j) => j.assignedCvId === "CV_CO").length;

  return (
    <div className="space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5" /> Motor Autónomo de Empleos Frontend Activo
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Búsqueda, Scoring de IA y Postulación 100% Automática
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Rastreo en tiempo real en Greenhouse, Lever, RemoteOK y Remotive. 
            El motor regional despacha tu <strong>CV Española 🇪🇸</strong> o <strong>CV Colombiana 🇨🇴</strong> con cero margen de error, 
            notificando cada postulación a tu canal de <strong>Discord</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/jobs">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Explorar Todas las Vacantes ({total})
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunLiveIngestion}
              isLoading={isIngesting}
              leftIcon={<Radio className="w-3.5 h-3.5 text-emerald-400" />}
            >
              {isIngesting ? "Rastreando APIs..." : "Rastrear Vacantes en Vivo"}
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vacantes Rastreadas"
          value={total}
          subtitle={`${remoteCount} Remotas • ${hybridCount} Híbridas`}
          icon={<Briefcase className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="Postuladas 100% Auto"
          value={applicationsCount}
          subtitle="Formularios ATS completados"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
        />
        <StatCard
          title="Afinidad Alta (≥70%)"
          value={highMatchJobs.length}
          subtitle="Stack Frontend compatible"
          icon={<Zap className="w-5 h-5" />}
          variant="amber"
        />
        <StatCard
          title="Canal Discord"
          value="Conectado"
          subtitle="Alertas enriquecidas activas"
          icon={<Bell className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* Regional CV Dispatcher Status Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1527] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">
              Despacho Geográfico de CVs Activo
            </h4>
            <p className="text-xs text-slate-400">
              {esCvs} vacantes asignadas a 🇪🇸 CV España • {coCvs} vacantes asignadas a 🇨🇴 CV Colombia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            🇪🇸 DNI/NIE • España & UE
          </span>
          <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            🇨🇴 Cédula • LATAM & Remoto
          </span>
        </div>
      </div>

      {/* High Match Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Ofertas Recomendadas con Alta Afinidad (≥70% Match)
            </h2>
            <p className="text-xs text-slate-400">
              Vacantes reales analizadas que cumplen tus criterios técnicos y de contratación
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            <Link
              href="/jobs"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Ver todas ({total}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {highMatchJobs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-3">
            <p className="text-sm text-slate-400">No hay vacantes con afinidad ≥70% todavía.</p>
            <Button
              size="sm"
              variant="primary"
              onClick={handleRunLiveIngestion}
              isLoading={isIngesting}
              leftIcon={<Radio className="w-3.5 h-3.5 text-white" />}
              className="text-xs"
            >
              Ejecutar Rastreo de Vacantes en Vivo
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highMatchJobs.slice(0, 6).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onViewDetails={handleOpenDetails}
                onAutoApply={handleAutoApply}
                onMarkManualApplied={handleMarkManualApplied}
                onDismiss={handleDismissJob}
                isApplying={applyingJobId === job.id}
              />
            ))}
          </div>
        ) : (
          <JobTable
            jobs={highMatchJobs.slice(0, 10)}
            onViewDetails={handleOpenDetails}
            onAutoApply={handleAutoApply}
            onMarkManualApplied={handleMarkManualApplied}
            onDismiss={handleDismissJob}
            applyingJobId={applyingJobId}
          />
        )}
      </div>

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAutoApply={handleAutoApply}
        onMarkManualApplied={handleMarkManualApplied}
        onDismiss={handleDismissJob}
        isApplying={selectedJob ? applyingJobId === selectedJob.id : false}
      />
    </div>
  );
}
