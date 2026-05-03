"use client";

import { useAppContext } from "@/state/app-context";
import { ModuleSwitcher } from "@/components/module-switcher";
import { GlobalToolbar } from "@/components/global-toolbar";
import { DiscordWorkspace } from "@/modules/discord/components/discord-workspace";

export function AppShell() {
  const { activeModule } = useAppContext();

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 rounded-[28px] border border-white/10 bg-chrome-900/80 p-4 shadow-panel backdrop-blur md:p-5">
        <header className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-chrome-950/60 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-chrome-500">
              Fake Web
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white">
              Modular mockup generator
            </h1>
          </div>
          <GlobalToolbar />
        </header>

        <ModuleSwitcher />

        <section className="grid flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          {activeModule === "discord" ? (
            <DiscordWorkspace />
          ) : (
            <div className="col-span-full rounded-[24px] border border-dashed border-white/10 bg-chrome-950/40 p-10 text-center text-chrome-300">
              This module is intentionally a placeholder in Phase 1.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
