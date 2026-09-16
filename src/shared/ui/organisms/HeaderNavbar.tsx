"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, FileText, Search, Settings2 } from "lucide-react";

const NAV_LINKS = [
  { href: "/jobs", label: "Vacantes", icon: Search },
  { href: "/applications", label: "Postulaciones", icon: FileText },
  { href: "/settings", label: "Configuración", icon: Settings2 },
] as const;

export function HeaderNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 group-hover:bg-blue-600/30 transition-colors">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">
            Sift System
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
