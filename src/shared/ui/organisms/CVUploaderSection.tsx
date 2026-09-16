"use client";

import React, { useState, useEffect, useRef } from "react";
import { CV_PROFILES, CANDIDATE_MASTER_PROFILE } from "@/modules/cv-engine/cvProfiles";
import { CVId } from "@/shared/types";
import { Card, CardHeader, CardTitle } from "@/shared/ui/atoms/Card";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Button } from "@/shared/ui/atoms/Button";
import {
  FileText,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Globe,
  MapPin,
  ExternalLink,
  Code2,
  DollarSign,
  Clock,
  Ban,
  HeartHandshake,
  UserCheck,
  Download,
  AlertTriangle,
  FolderCheck,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";

export const CVUploaderSection: React.FC = () => {
  const [uploadFeedback, setUploadFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<Record<string, { exists: boolean; sizeBytes: number }>>({});
  const [copiedLetter, setCopiedLetter] = useState(false);
  
  const fileInputEsRef = useRef<HTMLInputElement>(null);
  const fileInputCoRef = useRef<HTMLInputElement>(null);
  const fileInputCoverRef = useRef<HTMLInputElement>(null);

  const profiles = [CV_PROFILES.CV_ES, CV_PROFILES.CV_CO];
  const p = CANDIDATE_MASTER_PROFILE;

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/cv/status");
      const data = await res.json();
      if (data.success) {
        setFileStatus(data.cvs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileKey: CVId | "COVER_LETTER") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadFeedback({ type: "error", msg: "El archivo debe ser en formato PDF (.pdf)." });
      setTimeout(() => setUploadFeedback(null), 4000);
      return;
    }

    setUploadingId(fileKey);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("cvId", fileKey);

      const res = await fetch("/api/cv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadFeedback({
          type: "success",
          msg: `¡Archivo ${data.filename} guardado con éxito en storage/cv/ (${(data.sizeBytes / 1024).toFixed(1)} KB)!`,
        });
        await fetchStatus();
      } else {
        setUploadFeedback({ type: "error", msg: data.error || "Error al subir el archivo" });
      }
    } catch (err) {
      setUploadFeedback({ type: "error", msg: "Error de red al guardar el archivo" });
    } finally {
      setUploadingId(null);
      setTimeout(() => setUploadFeedback(null), 5000);
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(p.masterCoverLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 3000);
  };

  const coverStatus = fileStatus["COVER_LETTER"];
  const coverExistsOnDisk = coverStatus?.exists ?? false;

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputEsRef}
        onChange={(e) => handleFileUpload(e, "CV_ES")}
        accept=".pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputCoRef}
        onChange={(e) => handleFileUpload(e, "CV_CO")}
        accept=".pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputCoverRef}
        onChange={(e) => handleFileUpload(e, "COVER_LETTER")}
        accept=".pdf"
        className="hidden"
      />

      {/* Master Candidate Overview Card */}
      <Card className="border-blue-900/40 bg-gradient-to-r from-blue-950/30 via-slate-900 to-indigo-950/20 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white">{p.fullName}</h2>
              <Badge variant="success" size="sm" className="gap-1">
                <CheckCircle2 className="w-3 h-3" /> Perfil Maestro Activo
              </Badge>
              <Badge variant="warning" size="sm" className="gap-1">
                <HeartHandshake className="w-3 h-3 text-amber-400" /> Discapacidad {p.disability.percentage}%
              </Badge>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">{p.title} • Más de 8 años de experiencia</p>

            {/* Social & Portfolio Links */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <a
                href={p.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" /> LinkedIn (diego-villa-dev)
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={p.gitHubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" /> GitHub (DiegoVilla27)
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href={p.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" /> Portafolio (cabuweb.com)
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          </div>

          {/* Salary Expectations & Deal Breakers Quick Badges */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px] font-semibold uppercase tracking-wider">
                Expectativas Salariales:
              </span>
              <div className="flex items-center gap-2 text-slate-200">
                <span className="font-mono text-emerald-400 font-semibold">🇪🇸 {p.spain.salaryLabel}</span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-sky-400 font-semibold">🇨🇴 {p.colombia.salaryCopLabel}</span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-amber-400 font-semibold">🌐 {p.colombia.salaryUsdLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <Clock className="w-3 h-3" /> Inc./Entrevista: Inmediata
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <Ban className="w-3 h-3" /> Deal Breaker: 100% Presencial
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Storage location info banner */}
      <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-start gap-3">
        <FolderCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-indigo-200">
            Almacenamiento Físico de Archivos en el Sistema
          </p>
          <p className="text-slate-300 leading-relaxed">
            Tus CVs y tu Carta de Presentación se almacenan en <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">storage/cv/</code>. 
            Cuando <strong>Playwright</strong> detecta un campo de archivo en el formulario ATS, adjunta el PDF correspondiente desde el disco. Si el formulario solicita texto, inyecta la versión en texto personalizada por la IA.
          </p>
        </div>
      </div>

      {uploadFeedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            uploadFeedback.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {uploadFeedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          {uploadFeedback.msg}
        </div>
      )}

      {/* Two Regional CV Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {profiles.map((profile) => {
          const isES = profile.id === "CV_ES";
          const regionalData = isES ? p.spain : p.colombia;
          const status = fileStatus[profile.id];
          const existsOnDisk = status?.exists ?? false;

          return (
            <Card key={profile.id} className="border-slate-800 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{profile.flag}</span>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {profile.name}
                        <Badge variant="accent" size="sm">
                          {isES ? "30.000 € / año" : "5M COP / 2K USD mes"}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-slate-400">{profile.tagline}</p>
                    </div>
                  </div>
                </CardHeader>

                <div className="space-y-4 text-xs">
                  {/* Physical PDF attachment status box */}
                  <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          {regionalData.pdfFilename}
                          {existsOnDisk ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              En Disco
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              Pendiente Subir
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {existsOnDisk
                            ? `${(status.sizeBytes / (1024 * 1024)).toFixed(2)} MB • Listo para Playwright`
                            : "Sube tu archivo PDF para habilitar el auto-apply"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {existsOnDisk && (
                        <a
                          href={`/cv/${regionalData.pdfFilename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white rounded border border-slate-800 hover:bg-slate-850 transition-colors"
                          title="Ver / Descargar PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <Button
                        variant={existsOnDisk ? "outline" : "primary"}
                        size="sm"
                        isLoading={uploadingId === profile.id}
                        onClick={() => {
                          if (isES) {
                            fileInputEsRef.current?.click();
                          } else {
                            fileInputCoRef.current?.click();
                          }
                        }}
                        leftIcon={<Upload className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        {existsOnDisk ? "Actualizar PDF" : "Subir PDF"}
                      </Button>
                    </div>
                  </div>

                  {/* Legal status & credentials */}
                  <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800/80 space-y-1.5">
                    <div className="text-slate-400 font-medium">Estatus Legal & Identificación:</div>
                    <div className="text-slate-200 font-mono text-[11px]">{profile.legalStatus}</div>
                  </div>

                  {/* Candidate contact summary */}
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block">Email de Postulación:</span>
                      <span className="font-medium text-slate-200">{profile.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Teléfono / Prefijo:</span>
                      <span className="font-medium text-slate-200 font-mono">{regionalData.formattedPhone}</span>
                    </div>
                  </div>

                  {/* Target regions */}
                  <div>
                    <span className="text-slate-500 block mb-1.5">Regiones Objetivo & ATS Keywords:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.targetRegions.map((region) => (
                        <span
                          key={region}
                          className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[10px]"
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Core Stack */}
                  <div>
                    <span className="text-slate-500 block mb-1.5">Stack Frontend Destacado:</span>
                    <div className="flex flex-wrap gap-1">
                      {profile.coreStack.map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-800/30 text-[10px] font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {existsOnDisk
                    ? "Archivo físico en storage/cv/ listo"
                    : "Esperando PDF físico en storage/cv/"}
                </span>
                <Badge variant="outline" size="sm">
                  {profile.code}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* MASTER COVER LETTER CARD (PDF + Raw Text) */}
      <Card className="border-slate-800">
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Carta de Presentación Maestra
                  <Badge variant="info" size="sm">
                    PDF & Texto
                  </Badge>
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Disponible para adjuntar en PDF o inyectar como texto según lo requiera el formulario ATS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLetter}
                leftIcon={copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {copiedLetter ? "Texto Copiado" : "Copiar Texto"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* PDF Box */}
          <div className="space-y-3 lg:border-r lg:border-slate-800 lg:pr-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Archivo PDF de la Carta
            </h4>
            
            <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">
                    Diego_Villanueva_Carta_Presentacion.pdf
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {coverExistsOnDisk
                      ? `${(coverStatus.sizeBytes / (1024 * 1024)).toFixed(2)} MB • En disco`
                      : "Para formularios que soliciten adjuntar carta en PDF"}
                  </div>
                </div>
                {coverExistsOnDisk ? (
                  <Badge variant="success" size="sm">En Disco</Badge>
                ) : (
                  <Badge variant="warning" size="sm">Pendiente</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {coverExistsOnDisk && (
                  <a
                    href="/cv/Diego_Villanueva_Carta_Presentacion.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-white rounded border border-slate-800 hover:bg-slate-850 transition-colors"
                    title="Ver / Descargar PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  variant={coverExistsOnDisk ? "outline" : "primary"}
                  size="sm"
                  isLoading={uploadingId === "COVER_LETTER"}
                  onClick={() => fileInputCoverRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  className="text-xs w-full justify-center"
                >
                  {coverExistsOnDisk ? "Reemplazar PDF" : "Subir PDF de Carta"}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/30 text-[11px] text-slate-300 space-y-1">
              <span className="font-semibold text-blue-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Doble modalidad de envío:
              </span>
              <p className="text-slate-400">
                1. <strong>Si piden archivo:</strong> Playwright sube este PDF.<br />
                2. <strong>Si piden texto:</strong> La IA inyecta el contenido adaptado a la vacante.
              </p>
            </div>
          </div>

          {/* Raw Text Box */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contenido Maestro en Texto
              </h4>
              <span className="text-[11px] text-slate-500">
                Plantilla base para generación con IA
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {p.masterCoverLetter}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
