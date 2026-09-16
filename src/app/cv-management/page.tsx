"use client";

import React, { useState } from "react";
import { CVUploaderSection } from "@/shared/ui/organisms/CVUploaderSection";
import { dispatchCv } from "@/modules/cv-engine/cvDispatcher";
import { Card, CardHeader, CardTitle } from "@/shared/ui/atoms/Card";
import { Button } from "@/shared/ui/atoms/Button";
import { Input } from "@/shared/ui/atoms/Input";
import { Badge } from "@/shared/ui/atoms/Badge";
import { ShieldCheck, Cpu, Play, CheckCircle2, AlertTriangle } from "lucide-react";

export default function CvManagementPage() {
  const [testLocation, setTestLocation] = useState("Barcelona, España");
  const [testCurrency, setTestCurrency] = useState("EUR");
  const [testTitle, setTestTitle] = useState("Frontend Engineer");
  const [testResult, setTestResult] = useState<any>(() =>
    dispatchCv({ location: "Barcelona, España", currency: "EUR", title: "Frontend Engineer" })
  );

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = dispatchCv({
      location: testLocation,
      currency: testCurrency,
      title: testTitle,
    });
    setTestResult(res);
  };

  const presetExamples = [
    { title: "Senior React Developer", location: "Madrid, España", currency: "EUR" },
    { title: "Frontend Engineer", location: "Bogotá, Colombia (Remoto)", currency: "USD" },
    { title: "Fullstack Frontend", location: "Valencia, España (Híbrido)", currency: "EUR" },
    { title: "Lead Frontend", location: "Medellín, Colombia", currency: "COP" },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Gestión de CVs & Reglas de Despacho Regional
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configuración dual de CVs (España vs Colombia) y simulación del motor de enrutamiento sin margen de error.
        </p>
      </div>

      {/* Primary Dual CV Section */}
      <CVUploaderSection />

      {/* Simulator Card */}
      <Card className="border-slate-800">
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <CardTitle className="text-base">
                Simulador del Motor de Despacho Geográfico
              </CardTitle>
              <p className="text-xs text-slate-400">
                Pon a prueba el algoritmo con cualquier localización, moneda o descripción para verificar que nunca se equivoque.
              </p>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleRunSimulation} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Cargo / Título de la Vacante
              </label>
              <Input
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="ej. Senior Frontend"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Ubicación Detectada en Oferta
              </label>
              <Input
                value={testLocation}
                onChange={(e) => setTestLocation(e.target.value)}
                placeholder="ej. Barcelona, España o Medellín, Colombia"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Moneda / Marco
              </label>
              <Input
                value={testCurrency}
                onChange={(e) => setTestCurrency(e.target.value)}
                placeholder="EUR, USD, COP"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-500 font-medium">Probar casos reales:</span>
            {presetExamples.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestTitle(preset.title);
                  setTestLocation(preset.location);
                  setTestCurrency(preset.currency);
                  setTestResult(dispatchCv(preset));
                }}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors"
              >
                {preset.location} ({preset.currency})
              </button>
            ))}
          </div>

          <Button type="submit" size="sm" leftIcon={<Play className="w-3.5 h-3.5" />} className="text-xs">
            Ejecutar Prueba de Enrutamiento
          </Button>
        </form>

        {/* Simulation Output */}
        {testResult && (
          <div className="mt-5 p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {testResult.assignedCvId === "CV_ES" ? "🇪🇸" : "🇨🇴"}
                </span>
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    CV Asignada por el Motor:
                  </span>
                  <span className="text-sm font-bold text-blue-400">
                    {testResult.assignedCvId === "CV_ES"
                      ? "CV España (Diego_Villa_Frontend_Spain_CV.pdf)"
                      : "CV Colombia (Diego_Villa_Frontend_Colombia_CV.pdf)"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <Badge variant={testResult.isQuarantined ? "warning" : "success"}>
                  {testResult.isQuarantined
                    ? "Alerta de Cuarentena"
                    : `Confianza: ${(testResult.confidence * 100).toFixed(0)}%`}
                </Badge>
              </div>
            </div>

            <p className="text-xs text-slate-300 pt-2 border-t border-slate-800/80">
              <strong>Motivo de Selección:</strong> {testResult.reason}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
