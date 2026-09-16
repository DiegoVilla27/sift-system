"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/atoms/Button";
import {
  Briefcase,
  FileText,
  Send,
  Settings,
  LayoutDashboard,
  Bell,
  CheckCircle2,
  Menu,
  X,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Vacantes", icon: Briefcase },
  { href: "/cv-management", label: "CVs", icon: FileText },
  { href: "/applications", label: "Postulaciones", icon: Send },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export const HeaderNavbar: React.FC = () => {
  const pathname = usePathname();
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordSuccess, setDiscordSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTestDiscord = async () => {
    setIsTestingDiscord(true);
    setDiscordSuccess(false);
    try {
      const res = await fetch("/api/discord/test", { method: "POST" });
      if (res.ok) {
        setDiscordSuccess(true);
        setTimeout(() => setDiscordSuccess(false), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTestingDiscord(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-[#070b14]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center justify-between gap-6">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white hidden sm:block">
              Sift
            </span>
          </Link>

          {/* Center: Navigation */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150",
                    active
                      ? "text-white bg-slate-800/90"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", active && "text-blue-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Status + Discord Test + Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Status Dot */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mr-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Activo
            </div>

            {/* Discord Test */}
            <Button
              size="sm"
              variant={discordSuccess ? "success" : "ghost"}
              isLoading={isTestingDiscord}
              onClick={handleTestDiscord}
              leftIcon={
                discordSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )
              }
              className="text-xs"
            >
              <span className="hidden sm:inline">
                {discordSuccess ? "¡Enviado!" : "Discord"}
              </span>
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/60 bg-[#070b14] px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "text-white bg-slate-800"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <Icon className={cn("w-4 h-4", active && "text-blue-400")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
