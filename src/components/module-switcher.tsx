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
    <nav className="grid gap-3 md:grid-cols-3">
      {moduleOptions.map((module) => {
        const Icon = icons[module.id];
        const isActive = activeModule === module.id;
        const description =
          module.id === "discord"
            ? "Chat screenshots, grouped messages, story import"
            : module.id === "twitter"
              ? "Tweet, reply chain, block, suspension layouts"
              : "Reserved for future visual workspace";

        return (
          <button
            key={module.id}
            type="button"
            onClick={() => setActiveModule(module.id)}
            className={`group rounded-[24px] border p-4 text-left transition ${
              isActive
                ? "border-discord-accent/60 bg-[linear-gradient(135deg,rgba(88,101,242,0.18),rgba(255,255,255,0.06))] text-white shadow-[0_20px_50px_rgba(88,101,242,0.12)]"
                : "border-white/10 bg-white/[0.04] text-chrome-300 hover:border-white/20 hover:bg-white/[0.08]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`rounded-2xl p-3 ${isActive ? "bg-white/10 text-white" : "bg-black/20 text-chrome-200 group-hover:bg-white/10"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isActive ? (
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/90">
                    Active
                  </span>
                ) : null}
                {!module.enabled ? (
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-chrome-300">
                    Soon
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-base font-medium text-white">{module.label}</p>
              <p className="mt-2 text-sm leading-6 text-chrome-300">{description}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}
