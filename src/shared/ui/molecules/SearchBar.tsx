import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui/atoms/Input";
import { Button } from "@/shared/ui/atoms/Button";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Buscar por cargo, tecnología (ej. React, Next.js, TypeScript)...",
  onClear,
  className,
}) => {
  return (
    <div className={`relative flex items-center w-full ${className || ""}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        rightIcon={
          value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                onClear?.();
              }}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null
        }
      />
    </div>
  );
};
