"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Job, JobModality } from "@/shared/types";
import { SearchBar } from "@/shared/ui/molecules/SearchBar";
import { ViewModeToggle, ViewMode } from "@/shared/ui/molecules/ViewModeToggle";
import { JobCard } from "@/shared/ui/organisms/JobCard";
import { JobTable } from "@/shared/ui/organisms/JobTable";
import { JobDetailDrawer } from "@/shared/ui/organisms/JobDetailDrawer";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Search,
  Filter,
  Globe,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [modalityFilter, setModalityFilter] = useState<JobModality | "ALL">("ALL");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [postulatingJobId, setPostulatingJobId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Cargar vacantes almacenadas al montar
  useEffect(() => {
    fetch("/api/ingestion/run")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs?.length > 0) {
          setJobs(data.jobs);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchPlatforms = async () => {
    setIsSearching(true);
    setSearchMsg(null);
    try {
      const res = await fetch("/api/ingestion/run", { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
        setSearchMsg(
          `¡Búsqueda completada! ${data.totalFetched} ofertas rastreadas → ${data.newJobsCount} cumplen tus criterios (≥70% match, remoto/híbrido, español).`
        );
      }
    } catch {
      setSearchMsg("Error al buscar en las plataformas.");
    } finally {
      setIsSearching(false);
      setTimeout(() => setSearchMsg(null), 8000);
    }
  };

  const handlePostular = async (job: Job) => {
    setPostulatingJobId(job.id);
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
          sourceUrl: job.sourceUrl,
          sourcePlatform: job.sourcePlatform,
        }),
      });

      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        if (selectedJob?.id === job.id) {
          setSelectedJob(null);
          setIsDrawerOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostulatingJobId(null);
    }
  };

  const handleRechazar = async (job: Job) => {
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
      console.error(err);
    }
  };

  const availableJobs = useMemo(() => {
    return jobs
      .filter((job) => !job.isApplied && !job.isDismissed)
      .filter((job) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            job.title.toLowerCase().includes(q) ||
            job.company.toLowerCase().includes(q) ||
            job.stack.some((s) => s.toLowerCase().includes(q)) ||
            job.location.toLowerCase().includes(q) ||
            job.sourcePlatform.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .filter((job) => {
        if (modalityFilter !== "ALL" && job.modality !== modalityFilter) return false;
        return true;
      });
  }, [jobs, searchQuery, modalityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Vacantes de Frontend
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ofertas remotas e híbridas en español de 16+ plataformas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Badge variant="outline" size="md">
            {availableJobs.length} vacantes
          </Badge>
          <Button
            size="sm"
            variant="primary"
            isLoading={isSearching}
            onClick={handleSearchPlatforms}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="text-xs shadow-md shadow-blue-500/20"
          >
            {isSearching ? "Buscando..." : "🔍 Buscar en Todas las Plataformas"}
          </Button>
        </div>
      </div>

      {/* Search Result Message */}
      {searchMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          {searchMsg}
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1527] space-y-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filtrar por tecnología (React, Angular, Next.js), empresa, ubicación o plataforma..."
        />

        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
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
            <Globe className="w-3 h-3" /> Remoto
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
      </div>

      {/* Jobs Grid or Table */}
      {availableJobs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-3">
          <p className="text-sm text-slate-400">
            No se encontraron vacantes. Pulsa buscar para rastrear todas las plataformas.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSearchPlatforms}
            isLoading={isSearching}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Buscar Vacantes Ahora
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(j) => {
                setSelectedJob(j);
                setIsDrawerOpen(true);
              }}
              onPostular={handlePostular}
              onRechazar={handleRechazar}
              isPostulating={postulatingJobId === job.id}
            />
          ))}
        </div>
      ) : (
        <JobTable
          jobs={availableJobs}
          onViewDetails={(j) => {
            setSelectedJob(j);
            setIsDrawerOpen(true);
          }}
          onPostular={handlePostular}
          onRechazar={handleRechazar}
          postulatingJobId={postulatingJobId}
        />
      )}

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        job={selectedJob}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onPostular={handlePostular}
        onRechazar={handleRechazar}
        isPostulating={selectedJob ? postulatingJobId === selectedJob.id : false}
      />
    </div>
  );
}
