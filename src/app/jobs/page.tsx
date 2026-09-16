"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Job, JobModality, TargetRegion, CVId } from "@/shared/types";
import { SearchBar } from "@/shared/ui/molecules/SearchBar";
import { ViewModeToggle, ViewMode } from "@/shared/ui/molecules/ViewModeToggle";
import { JobCard } from "@/shared/ui/organisms/JobCard";
import { JobTable } from "@/shared/ui/organisms/JobTable";
import { JobDetailDrawer } from "@/shared/ui/organisms/JobDetailDrawer";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Filter,
  Globe,
  Building2,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  Radio,
} from "lucide-react";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<JobModality | "ALL">("ALL");
  const [regionFilter, setRegionFilter] = useState<TargetRegion | "ALL">("ALL");
  const [assignedCvFilter, setAssignedCvFilter] = useState<CVId | "ALL">("ALL");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionMsg, setIngestionMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [activeTab, setActiveTab] = useState<"AVAILABLE" | "DISMISSED">("AVAILABLE");

  // Load any previously ingested jobs on client mount
  useEffect(() => {
    fetch("/api/ingestion/run")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs && data.jobs.length > 0) {
          setJobs((prev) => {
            const existingIds = new Set(prev.map((j) => j.id));
            const newJobs = data.jobs.filter((j: Job) => !existingIds.has(j.id));
            return [...newJobs, ...prev];
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleRunLiveIngestion = async () => {
    setIsIngesting(true);
    setIngestionMsg(null);
    try {
      const res = await fetch("/api/ingestion/run", { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setIngestionMsg(`¡Rastreo exitoso! Se encontraron ${data.jobs.length} vacantes de Frontend en tiempo real.`);
      }
    } catch (err) {
      setIngestionMsg("Error al consultar las APIs de empleo.");
    } finally {
      setIsIngesting(false);
      setTimeout(() => setIngestionMsg(null), 6000);
    }
  };

  const handleDismissJob = async (job: Job) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id ? { ...j, isDismissed: true, dismissedAt: new Date().toISOString() } : j
      )
    );
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
      console.error("Error descartando oferta:", err);
    }
  };

  const handleRestoreJob = async (job: Job) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id ? { ...j, isDismissed: false, dismissedAt: undefined } : j
      )
    );
    try {
      await fetch("/api/jobs/dismiss", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch (err) {
      console.error("Error restaurando oferta:", err);
    }
  };

  const availableCount = jobs.filter((j) => !j.isApplied && !j.isDismissed).length;
  const dismissedCount = jobs.filter((j) => j.isDismissed).length;

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Tab filter: AVAILABLE hides applied and dismissed
      if (activeTab === "AVAILABLE") {
        if (job.isApplied || job.isDismissed) return false;
      } else if (activeTab === "DISMISSED") {
        if (!job.isDismissed) return false;
      }

      // Query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesStack = job.stack.some((s) => s.toLowerCase().includes(q));
        const matchesLocation = job.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesStack && !matchesLocation) {
          return false;
        }
      }

      // Modality filter
      if (modalityFilter !== "ALL" && job.modality !== modalityFilter) {
        return false;
      }

      // Region filter
      if (regionFilter !== "ALL" && job.region !== regionFilter) {
        return false;
      }

      // Assigned CV filter
      if (assignedCvFilter !== "ALL" && job.assignedCvId !== assignedCvFilter) {
        return false;
      }

      // Min Score filter
      if (job.matchScore < minScoreFilter) {
        return false;
      }

      return true;
    });
  }, [jobs, activeTab, searchQuery, modalityFilter, regionFilter, assignedCvFilter, minScoreFilter]);

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
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isApplied: true, applicationStatus: "SUCCESS" } : j))
        );
        if (selectedJob?.id === job.id) {
          setSelectedJob((prev) => (prev ? { ...prev, isApplied: true, applicationStatus: "SUCCESS" } : null));
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
          notes: "Postulación manual realizada directamente por Diego en la web",
        }),
      });

      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, isApplied: true, applicationStatus: "SUCCESS" } : j))
        );
        if (selectedJob?.id === job.id) {
          setSelectedJob((prev) => (prev ? { ...prev, isApplied: true, applicationStatus: "SUCCESS" } : null));
        }
      }
    } catch (err) {
      console.error("Error al registrar postulación manual:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Explorador de Vacantes Frontend
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conectado en vivo con Greenhouse, Lever, RemoteOK y Remotive. Análisis por IA y postulación automática.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Badge variant="outline" size="md">
            {filteredJobs.length} vacantes
          </Badge>
          <Button
            size="sm"
            variant="primary"
            isLoading={isIngesting}
            onClick={handleRunLiveIngestion}
            leftIcon={<Radio className="w-3.5 h-3.5 text-white" />}
            className="text-xs"
          >
            {isIngesting ? "Rastreando APIs..." : "Rastrear Vacantes en Vivo"}
          </Button>
        </div>
      </div>

      {ingestionMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> {ingestionMsg}
        </div>
      )}

      {/* Tabs: Disponibles vs Descartadas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("AVAILABLE")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "AVAILABLE"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <span>Vacantes Disponibles</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {availableCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("DISMISSED")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
            activeTab === "DISMISSED"
              ? "bg-amber-600/20 text-amber-400 border border-amber-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <span>Descartadas</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {dismissedCount}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1527] space-y-4">
        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filtrar por tecnología (React, TypeScript, Next.js, Tailwind), empresa o rol..."
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          {/* Modality Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Modalidad:
            </span>
            <button
              onClick={() => setModalityFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                modalityFilter === "ALL"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setModalityFilter("REMOTE")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                modalityFilter === "REMOTE"
                  ? "bg-emerald-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3 h-3" /> 100% Remoto
            </button>
            <button
              onClick={() => setModalityFilter("HYBRID")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                modalityFilter === "HYBRID"
                  ? "bg-sky-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building2 className="w-3 h-3" /> Híbrido
            </button>
          </div>

          {/* CV Assigned Filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">CV Asignada:</span>
            <button
              onClick={() => setAssignedCvFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                assignedCvFilter === "ALL"
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setAssignedCvFilter("CV_ES")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                assignedCvFilter === "CV_ES"
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🇪🇸</span> CV España
            </button>
            <button
              onClick={() => setAssignedCvFilter("CV_CO")}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                assignedCvFilter === "CV_CO"
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🇨🇴</span> CV Colombia
            </button>
          </div>

          {/* Min Score Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Score:
            </span>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value={0}>Todos los scores</option>
              <option value={70}>≥ 70% (Afinidad recomendada)</option>
              <option value={80}>≥ 80% (Alta afinidad)</option>
              <option value={90}>≥ 90% (Top match)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid or Table of Jobs */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-3">
          <p className="text-sm text-slate-400">No se encontraron vacantes con los filtros seleccionados.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunLiveIngestion}
            isLoading={isIngesting}
            leftIcon={<Radio className="w-3.5 h-3.5 text-blue-400" />}
            className="text-xs"
          >
            Rastrear Vacantes en Vivo ahora
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={handleOpenDetails}
              onAutoApply={handleAutoApply}
              onMarkManualApplied={handleMarkManualApplied}
              onDismiss={handleDismissJob}
              onRestore={handleRestoreJob}
              isApplying={applyingJobId === job.id}
            />
          ))}
        </div>
      ) : (
        <JobTable
          jobs={filteredJobs}
          onViewDetails={handleOpenDetails}
          onAutoApply={handleAutoApply}
          onMarkManualApplied={handleMarkManualApplied}
          onDismiss={handleDismissJob}
          onRestore={handleRestoreJob}
          applyingJobId={applyingJobId}
        />
      )}

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAutoApply={handleAutoApply}
        onMarkManualApplied={(j, cv) => handleMarkManualApplied(j, cv)}
        onDismiss={handleDismissJob}
        onRestore={handleRestoreJob}
        isApplying={selectedJob ? applyingJobId === selectedJob.id : false}
      />
    </div>
  );
}
