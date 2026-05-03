"use client";

import type { ComponentType } from "react";
import { AtSign, Instagram, MessageSquare } from "lucide-react";
import { useAppContext } from "@/state/app-context";
import { ModuleId, moduleOptions } from "@/state/app-types";

const icons: Record<ModuleId, ComponentType<{ className?: string }>> = {
  discord: MessageSquare,
  twitter: AtSign,
  instagram: Instagram,
};

export function ModuleSwitcher() {
  const { activeModule, setActiveModule } = useAppContext();

  return (
    <nav className="flex flex-wrap gap-3">
      {moduleOptions.map((module) => {
        const Icon = icons[module.id];
        const isActive = activeModule === module.id;

        return (
          <button
            key={module.id}
            type="button"
            onClick={() => setActiveModule(module.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? "border-discord-accent bg-discord-accent text-white"
                : "border-white/10 bg-white/5 text-chrome-300 hover:border-white/20 hover:bg-white/10"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{module.label}</span>
            {!module.enabled ? (
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em]">
                Soon
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
