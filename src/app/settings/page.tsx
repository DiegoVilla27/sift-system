"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PortalConfig, CandidateProfile } from "@/shared/types";
import { Switch } from "@/shared/ui/atoms/Switch";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import { StatCard } from "@/shared/ui/molecules/StatCard";
import { SearchBar } from "@/shared/ui/molecules/SearchBar";
import {
  Globe,
  Building2,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sliders,
  Layers,
  Sparkles,
  X,
  User,
  UploadCloud,
  FileText,
  Save,
  Code2,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  const [activeMainTab, setActiveMainTab] = useState<"PROFILE" | "PLATFORMS">("PROFILE");

  // ==================== ESTADO DE PERFIL Y CV ====================
  const [profile, setProfile] = useState<CandidateProfile>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    roleTitle: "Frontend Developer",
    yearsOfExperience: 0,
    technologies: [],
    cvFileName: "",
    lastUpdated: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // CV Parsing State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvPasteText, setCvPasteText] = useState("");
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [parseFeedback, setParseFeedback] = useState<string | null>(null);
  const [newTechInput, setNewTechInput] = useState("");

  // ==================== ESTADO DE PORTALES ====================
  const [platforms, setPlatforms] = useState<PortalConfig[]>([]);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "ALL" | "PORTAL" | "COMPANY_ATS" | "CUSTOM"
  >("ALL");

  // Modal State para Agregar Portal/Empresa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingPlatform, setIsSubmittingPlatform] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    category: "company_ats" as "portal" | "company_ats",
    ats: "greenhouse" as "greenhouse" | "lever",
    slug: "",
    url: "",
    regionHint: "SPAIN" as "SPAIN" | "LATAM" | "GLOBAL",
  });

  // Cargar Perfil y Plataformas al iniciar
  useEffect(() => {
    fetchProfile();
    fetchPlatforms();
  }, []);

  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Error al cargar perfil:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchPlatforms = async () => {
    setLoadingPlatforms(true);
    try {
      const res = await fetch("/api/platforms");
      const data = await res.json();
      if (data.success && Array.isArray(data.platforms)) {
        setPlatforms(data.platforms);
      }
    } catch (err) {
      console.error("Error al cargar plataformas:", err);
    } finally {
      setLoadingPlatforms(false);
    }
  };

  // ==================== HANDLERS DE PERFIL Y CV ====================

  const handleParseCv = async () => {
    if (!cvFile && !cvPasteText.trim()) {
      alert("Por favor selecciona un archivo de CV (PDF o texto) o pega el texto en el área inferior.");
      return;
    }

    setIsParsingCv(true);
    setParseFeedback(null);

    try {
      let res;
      if (cvFile) {
        const formData = new FormData();
        formData.append("cvFile", cvFile);
        if (cvPasteText.trim()) {
          formData.append("cvText", cvPasteText.trim());
        }
        res = await fetch("/api/profile/parse-cv", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/profile/parse-cv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cvText: cvPasteText, fileName: "cv_pegado.txt" }),
        });
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.detectedTechnologies)) {
        const detected = data.detectedTechnologies;

        // Combinar tecnologías detectadas con las existentes sin duplicados
        const combined = Array.from(new Set([...detected, ...profile.technologies]));

        setProfile((prev) => ({
          ...prev,
          technologies: combined,
          cvFileName: data.fileName || prev.cvFileName,
          email: prev.email || data.suggestedEmail || "",
          phone: prev.phone || data.suggestedPhone || "",
        }));

        setParseFeedback(
          `¡Éxito! Se detectaron ${detected.length} tecnologías en tu CV: ${detected.slice(0, 8).join(", ")}${
            detected.length > 8 ? "..." : ""
          }. Las hemos añadido a tu lista de búsqueda.`
        );
      } else {
        alert(data.error || "No se pudieron extraer tecnologías del CV");
      }
    } catch (err) {
      console.error("Error al procesar CV:", err);
      alert("Ocurrió un error al procesar el CV");
    } finally {
      setIsParsingCv(false);
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== techToRemove),
    }));
  };

  const handleAddTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();

    const tech = newTechInput.trim();
    if (!tech) return;

    if (!profile.technologies.some((t) => t.toLowerCase() === tech.toLowerCase())) {
      setProfile((prev) => ({
        ...prev,
        technologies: [...prev.technologies, tech],
      }));
    }
    setNewTechInput("");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      alert("Por favor indica al menos tu nombre completo");
      return;
    }

    setSavingProfile(true);
    setProfileSuccessMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setProfileSuccessMsg("¡Perfil y tecnologías guardados exitosamente! Ahora las búsquedas usarán estos criterios.");
        setTimeout(() => setProfileSuccessMsg(null), 6000);
      } else {
        alert(data.error || "No se pudo guardar el perfil");
      }
    } catch (err) {
      console.error("Error al guardar perfil:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  // ==================== HANDLERS DE PLATAFORMAS ====================

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    const nextVal = !currentEnabled;
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: nextVal } : p))
    );

    try {
      await fetch("/api/platforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled: nextVal }),
      });
    } catch (err) {
      console.error("Error toggling platform:", err);
      fetchPlatforms();
    }
  };

  const handleToggleAll = async (allEnabled: boolean) => {
    setPlatforms((prev) => prev.map((p) => ({ ...p, enabled: allEnabled })));
    try {
      await fetch("/api/platforms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allEnabled }),
      });
    } catch (err) {
      console.error("Error toggling all platforms:", err);
      fetchPlatforms();
    }
  };

  const handleCreatePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    if (newForm.category === "company_ats" && !newForm.slug.trim()) {
      alert("Por favor ingresa el slug público de la empresa en el ATS");
      return;
    }

    setIsSubmittingPlatform(true);
    try {
      const res = await fetch("/api/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (data.success && data.platforms) {
        setPlatforms(data.platforms);
        setIsModalOpen(false);
        setNewForm({
          name: "",
          category: "company_ats",
          ats: "greenhouse",
          slug: "",
          url: "",
          regionHint: "SPAIN",
        });
      } else {
        alert(data.error || "No se pudo agregar la plataforma");
      }
    } catch (err) {
      console.error("Error creating platform:", err);
    } finally {
      setIsSubmittingPlatform(false);
    }
  };

  const handleDeletePlatform = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta fuente personalizada?")) return;

    setPlatforms((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch("/api/platforms", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error("Error deleting platform:", err);
      fetchPlatforms();
    }
  };

  const filteredPlatforms = useMemo(() => {
    return platforms.filter((p) => {
      if (selectedCategory === "PORTAL" && p.category !== "portal") return false;
      if (selectedCategory === "COMPANY_ATS" && p.category !== "company_ats") return false;
      if (selectedCategory === "CUSTOM" && !p.isCustom) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSlug = p.slug?.toLowerCase().includes(q);
        const matchesUrl = p.url?.toLowerCase().includes(q);
        return matchesName || matchesSlug || matchesUrl;
      }

      return true;
    });
  }, [platforms, selectedCategory, searchQuery]);

  const total = platforms.length;
  const enabledCount = platforms.filter((p) => p.enabled).length;
  const portalsCount = platforms.filter((p) => p.category === "portal").length;
  const companiesCount = platforms.filter((p) => p.category === "company_ats").length;
  const customCount = platforms.filter((p) => p.isCustom).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-400" />
            Configuración del Sistema
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestiona tu perfil, sube tu CV para extraer tus tecnologías y controla qué portales y empresas rastrear.
          </p>
        </div>
      </div>

      {/* Main Tabs (Perfil vs Portales) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveMainTab("PROFILE")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === "PROFILE"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil y Tecnologías de CV ({profile.technologies.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("PLATFORMS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === "PLATFORMS"
              ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Portales y Empresas ({enabledCount}/{total} activos)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PESTAÑA 1: PERFIL DEL CANDIDATO Y CV */}
      {/* ========================================================================= */}
      {activeMainTab === "PROFILE" && (
        <div className="space-y-6">
          {profileSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              {profileSuccessMsg}
            </div>
          )}

          {/* Formulario Principal de Perfil */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Información del Candidato
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Puesto / Rol Objetivo</label>
                  <input
                    type="text"
                    value={profile.roleTitle}
                    onChange={(e) => setProfile({ ...profile, roleTitle: e.target.value })}
                    placeholder="Ej: Senior Frontend Developer"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email de Contacto</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="ejemplo@correo.com"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Teléfono</label>
                  <input
                    type="text"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+34 600 000 000 / +57 300 000 0000"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Ubicación / País</label>
                  <input
                    type="text"
                    value={profile.location || ""}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Valencia, España / Colombia (Remoto)"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Años de Experiencia</label>
                  <input
                    type="number"
                    value={profile.yearsOfExperience || 0}
                    onChange={(e) => setProfile({ ...profile, yearsOfExperience: Number(e.target.value) })}
                    placeholder="8"
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Panel de Carga y Extracción de CV */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    Cargar CV para Extracción Automática de Tecnologías
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sube tu archivo de currículum (PDF o texto) o pega el texto directamente. El sistema analizará tus habilidades y las registrará para el matchmaking de vacantes.
                  </p>
                </div>
              </div>

              {parseFeedback && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  <span>{parseFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opción 1: Archivo */}
                <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Opción A: Subir Archivo de CV (PDF, TXT)
                  </div>

                  <input
                    type="file"
                    accept=".pdf,.txt,.md,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCvFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />

                  {profile.cvFileName && (
                    <p className="text-[11px] text-slate-400">
                      Archivo guardado actualmente:{" "}
                      <strong className="text-slate-200">{profile.cvFileName}</strong>
                    </p>
                  )}
                </div>

                {/* Opción 2: Pegar texto */}
                <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Code2 className="w-4 h-4 text-purple-400" />
                    Opción B: Pegar Texto de CV / LinkedIn
                  </div>

                  <textarea
                    rows={3}
                    value={cvPasteText}
                    onChange={(e) => setCvPasteText(e.target.value)}
                    placeholder="Pega aquí el texto de tu currículum, resumen o extracto técnico..."
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg p-2.5 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleParseCv}
                  isLoading={isParsingCv}
                  leftIcon={<Sparkles className="w-4 h-4 text-white" />}
                  className="text-xs shadow-md shadow-blue-500/20"
                >
                  {isParsingCv ? "Analizando CV..." : "Analizar y Extraer Tecnologías de CV"}
                </Button>
              </div>
            </div>

            {/* Tecnologías Activas del Candidato */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    Tecnologías Activas para la Búsqueda ({profile.technologies.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estas tecnologías extraídas de tu CV se compararán en tiempo real con las ofertas encontradas para calcular el porcentaje de afinidad (mínimo 70%).
                  </p>
                </div>

                {/* Input Agregar Tecnología Manual */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <input
                    type="text"
                    value={newTechInput}
                    onChange={(e) => setNewTechInput(e.target.value)}
                    onKeyDown={handleAddTech}
                    placeholder="Ej: Svelte, GraphQL..."
                    className="bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 w-36"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTech}
                    className="text-xs px-2.5 py-1.5"
                  >
                    + Añadir
                  </Button>
                </div>
              </div>

              {profile.technologies.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-6 text-center">
                  No hay tecnologías cargadas. Sube tu CV arriba o añade habilidades manualmente.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 group hover:border-blue-500/40 transition-colors"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTech(tech)}
                        className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                        title={`Eliminar ${tech}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Criterio de Afinidad Mínima (Match Score) */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0d1527] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Umbral Mínimo de Afinidad ({profile.minMatchScore ?? 70}%)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configura el porcentaje de afinidad técnico que debe tener una oferta respecto a tu CV para ser aprobada en la búsqueda.
                  </p>
                </div>

                <span className="px-3 py-1 text-xs font-bold rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 self-start sm:self-auto">
                  Score Mínimo: {profile.minMatchScore ?? 70}%
                </span>
              </div>

              {/* Slider interactivo */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500 font-mono">30%</span>
                  <input
                    type="range"
                    min="30"
                    max="95"
                    step="5"
                    value={profile.minMatchScore ?? 70}
                    onChange={(e) =>
                      setProfile({ ...profile, minMatchScore: Number(e.target.value) })
                    }
                    className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-xs text-slate-500 font-mono">95%</span>
                </div>

                {/* Presets rápidos */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 mr-1">Presets recomendados:</span>
                  {[
                    { val: 50, label: "50% (Flexible)" },
                    { val: 60, label: "60% (Moderado)" },
                    { val: 70, label: "70% (Estándar)" },
                    { val: 80, label: "80% (Estricto)" },
                    { val: 90, label: "90% (Alta afinidad)" },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setProfile({ ...profile, minMatchScore: preset.val })}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                        (profile.minMatchScore ?? 70) === preset.val
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botón Guardar Cambios */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={savingProfile}
                leftIcon={<Save className="w-4 h-4" />}
                className="shadow-lg shadow-blue-500/20"
              >
                {savingProfile ? "Guardando..." : "Guardar Perfil y Tecnologías"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PESTAÑA 2: PORTALES Y EMPRESAS */}
      {/* ========================================================================= */}
      {activeMainTab === "PLATFORMS" && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Fuentes"
              value={total}
              subtitle={`${enabledCount} activas en la búsqueda`}
              icon={<Layers className="w-5 h-5" />}
              variant="blue"
            />
            <StatCard
              title="Portales de Empleo"
              value={portalsCount}
              subtitle="Google, LinkedIn, InfoJobs, PeakU..."
              icon={<Globe className="w-5 h-5" />}
              variant="purple"
            />
            <StatCard
              title="Empresas con ATS"
              value={companiesCount}
              subtitle="Greenhouse y Lever"
              icon={<Building2 className="w-5 h-5" />}
              variant="emerald"
            />
            <StatCard
              title="Personalizadas"
              value={customCount}
              subtitle="Añadidas por ti"
              icon={<Sparkles className="w-5 h-5" />}
              variant="amber"
            />
          </div>

          {/* Filter and Quick Actions Bar */}
          <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1527] space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1 max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar portal o empresa (ej: Google, LinkedIn, Indra, GFT, Cabify)..."
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAll(true)}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  className="text-xs"
                >
                  Activar Todos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleAll(false)}
                  leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-400" />}
                  className="text-xs"
                >
                  Desactivar Todos
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  className="text-xs shadow-md shadow-blue-500/20"
                >
                  Agregar Empresa / Portal
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === "ALL"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                Todas las Fuentes ({total})
              </button>
              <button
                onClick={() => setSelectedCategory("PORTAL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === "PORTAL"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                Portales de Empleo ({portalsCount})
              </button>
              <button
                onClick={() => setSelectedCategory("COMPANY_ATS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === "COMPANY_ATS"
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                Empresas con ATS ({companiesCount})
              </button>
              {customCount > 0 && (
                <button
                  onClick={() => setSelectedCategory("CUSTOM")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                    selectedCategory === "CUSTOM"
                      ? "bg-amber-600/20 text-amber-400 border border-amber-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  Personalizadas ({customCount})
                </button>
              )}
            </div>
          </div>

          {/* Platforms Grid */}
          {filteredPlatforms.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl bg-[#0d1527]/40 space-y-2">
              <p className="text-sm text-slate-400">
                No se encontraron fuentes con el filtro especificado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlatforms.map((platform) => {
                const isPortal = platform.category === "portal";

                return (
                  <div
                    key={platform.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      platform.enabled
                        ? "bg-[#0d1527] border-slate-800 hover:border-slate-700"
                        : "bg-slate-900/30 border-slate-900 opacity-60"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            platform.enabled ? "bg-emerald-400 shadow-sm shadow-emerald-500/50" : "bg-slate-600"
                          }`}
                        />
                        <h3 className="text-xs font-bold text-white truncate">
                          {platform.name}
                        </h3>
                        {platform.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold shrink-0">
                            Custom
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <Badge
                          variant={isPortal ? "purple" : "info"}
                          size="sm"
                          className="text-[9px] px-1.5 py-0"
                        >
                          {isPortal
                            ? "Portal"
                            : platform.ats === "greenhouse"
                            ? "Greenhouse"
                            : "Lever"}
                        </Badge>

                        {platform.regionHint && (
                          <span className="text-slate-400 text-[10px]">
                            {platform.regionHint === "SPAIN"
                              ? "🇪🇸 España"
                              : platform.regionHint === "LATAM"
                              ? "🇨🇴 LATAM"
                              : "🌍 Global"}
                          </span>
                        )}

                        {platform.slug && (
                          <span className="text-slate-500 font-mono text-[9px] truncate max-w-[100px]">
                            @{platform.slug}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {platform.url && (
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded text-slate-500 hover:text-blue-400 transition-colors"
                          title="Visitar sitio web"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {platform.isCustom && (
                        <button
                          onClick={() => handleDeletePlatform(platform.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar fuente personalizada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <Switch
                        checked={platform.enabled}
                        onChange={() => handleToggle(platform.id, platform.enabled)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Agregar Portal / Empresa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Agregar Empresa o Portal
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conecta una nueva empresa con ATS o un portal de búsqueda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlatform} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nombre de la Empresa o Portal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Stripe, Inditex, Vercel, Glovo..."
                  value={newForm.name}
                  onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                  className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Tipo de Fuente *
                  </label>
                  <select
                    value={newForm.category}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        category: e.target.value as "portal" | "company_ats",
                      })
                    }
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="company_ats">Empresa con ATS</option>
                    <option value="portal">Portal de Empleo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Región / Enfoque
                  </label>
                  <select
                    value={newForm.regionHint}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        regionHint: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="SPAIN">🇪🇸 España & Europa</option>
                    <option value="LATAM">🇨🇴 LATAM / Colombia</option>
                    <option value="GLOBAL">🌍 Global / Remoto</option>
                  </select>
                </div>
              </div>

              {newForm.category === "company_ats" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Software ATS *
                    </label>
                    <select
                      value={newForm.ats}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          ats: e.target.value as "greenhouse" | "lever",
                        })
                      }
                      className="w-full bg-[#070d19] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                    >
                      <option value="greenhouse">Greenhouse (boards-api)</option>
                      <option value="lever">Lever (api.lever.co)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Slug del Board *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: stripe, cabify..."
                      value={newForm.slug}
                      onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                      className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  URL Web o Enlace de Empleos (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://empresa.com/careers"
                  value={newForm.url}
                  onChange={(e) => setNewForm({ ...newForm, url: e.target.value })}
                  className="w-full bg-[#070d19] border border-slate-800 text-slate-100 placeholder-slate-500 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingPlatform}
                  className="text-xs"
                >
                  Guardar Fuente
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
