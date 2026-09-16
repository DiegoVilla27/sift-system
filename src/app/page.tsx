"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Job, CandidateProfile, PortalConfig } from "@/shared/types";
import { StatCard } from "@/shared/ui/molecules/StatCard";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Search,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  Code2,
  FileCheck2,
  Layers,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [platformsCount, setPlatformsCount] = useState(0);
  const [activePlatformsCount, setActivePlatformsCount] = useState(0);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  useEffect(() => {
    // 1. Cargar vacantes existentes
    fetch("/api/ingestion/run")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.jobs?.length > 0) {
          setJobs(data.jobs.filter((j: Job) => !j.isApplied && !j.isDismissed));
        }
      })
      .catch(() => { });

    // 2. Cargar conteo de postulaciones
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          setApplicationsCount(data.applications.length);
        }
      })
      .catch(() => { });

    // 3. Cargar perfil del candidato
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile);
        }
      })
      .catch(() => { });

    // 4. Cargar plataformas
    fetch("/api/platforms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.platforms)) {
          setPlatformsCount(data.platforms.length);
          setActivePlatformsCount(data.platforms.filter((p: PortalConfig) => p.enabled).length);
        }
      })
      .catch(() => { });
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchDone(false);
    try {
      const res = await fetch("/api/ingestion/run", { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.jobs)) {
        setJobs(data.jobs.filter((j: Job) => !j.isApplied && !j.isDismissed));
        setSearchDone(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const available = jobs.filter((j) => !j.isApplied && !j.isDismissed);
  const remoteCount = available.filter((j) => j.modality === "REMOTE").length;
  const hybridCount = available.filter((j) => j.modality === "HYBRID").length;

  return (
    <div className="space-y-8">
      {/* Hero Banner Informativo */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            Centro de Control & Búsqueda Inteligente
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Scout de Vacantes Frontend en Español
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Rastrea simultáneamente en <strong>Google, LinkedIn, InfoJobs, CompuTrabajo, Get on Board, PeakU, Torre, Domestika</strong> y en los portales ATS de más de <strong>40 empresas tecnológicas</strong> (GFT, Indra, Globant, MercadoLibre, Cabify, Stripe, Vercel, etc.).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSearch}
              isLoading={isSearching}
              leftIcon={<Search className="w-4 h-4" />}
              className="shadow-lg shadow-blue-500/20"
            >
              {isSearching
                ? "Rastreando portales y empresas..."
                : "🔍 Buscar Vacantes en Todas las Fuentes"}
            </Button>
            <Link href="/jobs">
              <Button
                size="sm"
                variant="outline"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Ver Vacantes Disponibles ({available.length})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mensaje de Resultado de Búsqueda */}
      {searchDone && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              ¡Búsqueda masiva finalizada! Hay <strong>{available.length} vacantes</strong> listas con afinidad técnica $\ge 70\%$ basadas en tu CV.
            </span>
          </div>
          <Link href="/jobs">
            <span className="underline font-semibold hover:text-emerald-300 text-xs">
              Ir al catálogo de vacantes →
            </span>
          </Link>
        </div>
      )}

      {/* Tarjetas de Métricas Informativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Vacantes Encontradas"
          value={available.length}
          subtitle={`${remoteCount} Remotas • ${hybridCount} Híbridas`}
          icon={<Briefcase className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="Postuladas"
          value={applicationsCount}
          subtitle="En seguimiento activo"
          icon={<Send className="w-5 h-5" />}
          variant="emerald"
        />
        <StatCard
          title="Afinidad Alta"
          value={available.filter((j) => j.matchScore >= 85).length}
          subtitle="Score $\ge 85\%$ con tu perfil"
          icon={<Zap className="w-5 h-5" />}
          variant="amber"
        />
        <StatCard
          title="Fuentes Conectadas"
          value={`${activePlatformsCount} / ${platformsCount}`}
          subtitle="Portales y empresas activos"
          icon={<Globe className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* Sección 1: Perfil Activo del Candidato */}
      {profile && (
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                <h2 className="text-base font-bold text-white">
                  Candidato Activo: {profile.fullName}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {profile.roleTitle} • {profile.location} • {profile.yearsOfExperience} años de experiencia
              </p>
            </div>

            <Link href="/settings">
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Sliders className="w-3.5 h-3.5 text-blue-400" />}
                className="text-xs"
              >
                Configurar Perfil & CV
              </Button>
            </Link>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                Tecnologías del CV usadas para el Matchmaking ({profile.technologies.length}):
              </span>
              {profile.cvFileName && (
                <span className="text-[11px] text-slate-500">
                  CV: {profile.cvFileName}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.technologies.slice(0, 16).map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300"
                >
                  {tech}
                </span>
              ))}
              {profile.technologies.length > 16 && (
                <span className="px-2.5 py-1 text-[11px] text-slate-400 font-semibold rounded-lg bg-slate-800 border border-slate-700">
                  +{profile.technologies.length - 16} más
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
