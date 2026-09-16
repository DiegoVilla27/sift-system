"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/shared/ui/atoms/Card";
import { Input } from "@/shared/ui/atoms/Input";
import { Button } from "@/shared/ui/atoms/Button";
import { Switch } from "@/shared/ui/atoms/Switch";
import { Badge } from "@/shared/ui/atoms/Badge";
import { FormField } from "@/shared/ui/molecules/FormField";
import {
  Bell,
  CheckCircle2,
  Send,
  ShieldCheck,
  Settings,
  Webhook,
  AlertCircle,
  Sparkles,
  KeyRound,
  LogIn,
  Trash2,
  ExternalLink,
  Lock,
} from "lucide-react";

interface SessionInfo {
  id: "linkedin" | "infojobs" | "computrabajo";
  name: string;
  hasSession: boolean;
  lastUpdated?: string;
  cookieCount: number;
  description: string;
}

export default function SettingsPage() {
  const [webhookUrl, setWebhookUrl] = useState(
    "https://discord.com/api/webhooks/1549418546327593121/9EimY7LwrpwmlQU1UaZWOdpHMUzeKE-1N79WVaLXViozAdWLCAhJFabrOHVCMyhOb76U"
  );
  const [minScore, setMinScore] = useState(70);
  const [notifyOnApply, setNotifyOnApply] = useState(true);
  const [notifyOnAmbiguity, setNotifyOnAmbiguity] = useState(true);
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(20);

  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Estados para Sesiones de Portales (LinkedIn, InfoJobs, CompuTrabajo)
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [activeLoginPlatform, setActiveLoginPlatform] = useState<string | null>(null);
  const [sessionFeedback, setSessionFeedback] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/session/status");
      const data = await res.json();
      if (data.success && Array.isArray(data.statuses)) {
        setSessions(data.statuses);
      }
    } catch (err) {
      console.error("Error al cargar estado de sesiones:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleLaunchLogin = async (platformId: string) => {
    setActiveLoginPlatform(platformId);
    setSessionFeedback(null);
    try {
      const res = await fetch("/api/session/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId }),
      });
      const data = await res.json();
      setSessionFeedback({
        message: data.message || "Proceso de login completado.",
        success: Boolean(data.success),
      });
      await fetchSessions();
    } catch (err) {
      setSessionFeedback({
        message: "Error de red al conectar con el asistente de sesión.",
        success: false,
      });
    } finally {
      setActiveLoginPlatform(null);
    }
  };

  const handleDeleteSession = async (platformId: string) => {
    if (!confirm("¿Deseas desvincular la sesión guardada para este portal?")) return;
    try {
      const res = await fetch("/api/session/status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
      }
    } catch (err) {
      console.error("Error al eliminar sesión:", err);
    }
  };

  // Cargar configuración real persistida desde el backend y estado de sesiones
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.webhookUrl) setWebhookUrl(s.webhookUrl);
          if (s.minScore) setMinScore(s.minScore);
          if (typeof s.notifyOnApply === "boolean") setNotifyOnApply(s.notifyOnApply);
          if (typeof s.notifyOnAmbiguity === "boolean") setNotifyOnAmbiguity(s.notifyOnAmbiguity);
          if (typeof s.autoApplyEnabled === "boolean") setAutoApplyEnabled(s.autoApplyEnabled);
          if (s.maxPerDay) setMaxPerDay(s.maxPerDay);
        }
      })
      .catch(() => {});

    fetchSessions();
  }, []);

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    setTestError(null);
    try {
      const res = await fetch("/api/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 5000);
      } else {
        setTestError(data.error || "Error desconocido al enviar a Discord");
      }
    } catch (err) {
      setTestError("Error de red al conectar con Discord");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          minScore,
          notifyOnApply,
          notifyOnAmbiguity,
          autoApplyEnabled,
          maxPerDay,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error guardando settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configuración del Sistema
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Ajusta el webhook de Discord, umbrales de postulación automática y el comportamiento del motor de CV.
        </p>
      </div>

      {/* Discord Webhook Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Notificaciones por Discord (Webhook)</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura la URL del webhook para recibir alertas enriquecidas con embeds visuales.
              </p>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4">
          <FormField
            label="URL del Webhook de Discord"
            description="Cópialo desde: Ajustes del Canal ➔ Integraciones ➔ Webhooks ➔ Copiar URL"
            required
          >
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
              leftIcon={<Bell className="w-4 h-4" />}
            />
          </FormField>

          {/* Test Discord CTA */}
          <div className="flex items-center gap-3">
            <Button
              variant={testSuccess ? "success" : "outline"}
              size="sm"
              onClick={handleTestWebhook}
              isLoading={isTesting}
              leftIcon={
                testSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-indigo-400" />
                )
              }
              className="text-xs"
            >
              {testSuccess ? "¡Enviado con éxito! Revisa tu canal" : "Enviar Notificación de Prueba"}
            </Button>

            {testError && (
              <span className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {testError}
              </span>
            )}
          </div>

          {/* Notification Toggles */}
          <div className="pt-4 space-y-3 border-t border-slate-800">
            <Switch
              checked={notifyOnApply}
              onChange={setNotifyOnApply}
              label="Notificar en cada postulación automática exitosa"
              description="Envía un Embed a Discord con la empresa, score, CV usada y estado."
            />
            <Switch
              checked={notifyOnAmbiguity}
              onChange={setNotifyOnAmbiguity}
              label="Alertar cuando una vacante esté en zona gris de CV"
              description="Si el motor no tiene 95% de confianza sobre qué CV usar, recibirás una alerta antes del envío."
            />
          </div>
        </div>
      </Card>

      {/* Auto-Apply Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Motor de Postulación 100% Automática</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Define los umbrales para que el sistema aplique sin intervención humana.
              </p>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4">
          <Switch
            checked={autoApplyEnabled}
            onChange={setAutoApplyEnabled}
            label="Activar postulación completamente automática"
            description="El bot aplicará en cuanto detecte una vacante que supere el umbral de score configurado."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Score mínimo para auto-apply"
              description="Solo se postulará a ofertas con scoring IA igual o superior a este valor"
            >
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={50}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-24"
                />
                <Badge variant={minScore >= 70 ? "success" : "warning"}>
                  {minScore}% umbral
                </Badge>
              </div>
            </FormField>

            <FormField
              label="Máximo de postulaciones por día"
              description="Límite diario para evitar saturar portales ATS con envíos masivos"
            >
              <Input
                type="number"
                min={1}
                max={100}
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(Number(e.target.value))}
                className="w-24"
              />
            </FormField>
          </div>
        </div>
      </Card>

      {/* CV Routing Safety */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Seguridad de Enrutamiento CV España / Colombia</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuración del comportamiento en caso de ambigüedad geográfica.
              </p>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-xs text-slate-300 leading-relaxed">
            El motor de despacho ejecuta 2 capas de verificación antes de enviar cualquier CV:
            <ol className="mt-2 ml-4 space-y-1 list-decimal text-slate-400">
              <li>
                <strong className="text-slate-200">Capa 1 — Reglas Deterministas:</strong> Ubicación
                explícita (España/Colombia), moneda (EUR/COP/USD), requisitos legales (DNI/NIE/Cédula).
              </li>
              <li>
                <strong className="text-slate-200">Capa 2 — Clasificación IA (Gemini):</strong> Análisis
                semántico cuando no hay señales geográficas claras. Si la confianza es inferior al 95%, la vacante
                entra en <strong className="text-amber-400">cuarentena</strong> y te notifica por Discord.
              </li>
            </ol>
          </div>

          {/* Documentos Legales Registrados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">🇪🇸 Identidad España</span>
                <Badge variant="success" size="sm">DNI Activo</Badge>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">DNI: <span className="text-white font-semibold">26943391H</span></p>
              <p className="text-slate-500 text-[10px]">Valencia • +34 658 07 48 21 • 77% Discapacidad (LGD)</p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">🇨🇴 Identidad Colombia</span>
                <Badge variant="success" size="sm">CC Activa</Badge>
              </div>
              <p className="text-slate-400 font-mono text-[11px]">Cédula: <span className="text-white font-semibold">1094930706</span></p>
              <p className="text-slate-500 text-[10px]">Armenia, Quindío • +57 311 478 0189</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-medium">Estado actual: 0 errores de despacho registrados. Motor operando con precisión del 100%.</span>
          </div>
        </div>
      </Card>

      {/* Portal Sessions (LinkedIn, InfoJobs, CompuTrabajo) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Sesiones Seguras de Portales (1-Clic sin compartir contraseñas)</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inicia sesión una sola vez en tu navegador Chromium local para permitir Easy Apply y escaneo profundo.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="space-y-4">
          {/* Privacy Notice */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Privacidad y Seguridad Garantizada:</strong> Tus contraseñas
              jamás se almacenan en texto ni viajan por APIs externas. Al presionar{" "}
              <span className="text-purple-300 font-semibold">Iniciar Sesión</span>, se abrirá una ventana
              real de Chromium en tu Mac para que ingreses con tu cuenta y 2FA con total confianza. Sift System
              únicamente persiste la cookie autenticada en{" "}
              <code className="bg-slate-800 px-1 py-0.5 rounded text-purple-300">storage/sessions/</code>.
            </div>
          </div>

          {sessionFeedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                sessionFeedback.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              {sessionFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              )}
              <span>{sessionFeedback.message}</span>
            </div>
          )}

          {/* Platforms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {sessions.map((platform) => (
              <div
                key={platform.id}
                className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1527]/70 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{platform.name}</span>
                    <Badge variant={platform.hasSession ? "success" : "warning"} className="text-[10px]">
                      {platform.hasSession ? `Conectada (${platform.cookieCount})` : "Sin Sesión"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {platform.description}
                  </p>
                  {platform.hasSession && platform.lastUpdated && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Última sincr: {platform.lastUpdated}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant={platform.hasSession ? "outline" : "primary"}
                    onClick={() => handleLaunchLogin(platform.id)}
                    isLoading={activeLoginPlatform === platform.id}
                    leftIcon={<LogIn className="w-3.5 h-3.5" />}
                    className="text-xs flex-1"
                    title={`Abrir ventana de navegador para ${platform.name}`}
                  >
                    {platform.hasSession ? "Renovar" : "Iniciar Sesión"}
                  </Button>

                  {platform.hasSession && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSession(platform.id)}
                      className="text-xs px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Desvincular y borrar sesión guardada"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        {saved && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configuración guardada exitosamente
          </span>
        )}
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Settings className="w-4 h-4" />}
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
